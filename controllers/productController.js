const { Op, Sequelize } = require("sequelize");
const Product = require("../models/Product/Product");
const Drug = require("../models/Product/Drug");
const StoreProduct = require("../models/Product/StoreProduct");
const Store = require("../models/Store/Store");
const ProductMargin = require("../models/Product/ProductMargin");
const { sequelize } = require("../config/db");
const OrderProduct = require("../models/Order/Product");
const Order = require("../models/Order/Order");

exports.createProduct = async (req, res) => {
  const transaction = await sequelize.transaction({ timeout: 60000 });
  try {
    const {
      productName,
      manufacturer,
      units,
      type,
      drugs,
      storeQty,
      marginPercentage,
      pricing,
      uom,
    } = req.body;

    if (!productName || !manufacturer || !units || !type || !storeQty || !pricing || !uom) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingProduct = await Product.findOne({
      where: { productName: productName },
    });
    if (existingProduct) {
      await transaction.rollback();
      return res.status(400).json({ error: "Product already exists" });
    }

    const uniqueStoreIds = [...new Set(storeQty.map((store) => store.storeId))];

    const stores = await Store.findAll({
      where: {
        SID: uniqueStoreIds,
      },
      attributes: ["SID"],
    });

    const validStoreIds = new Set(stores.map((store) => store.SID));
    const invalidStores = uniqueStoreIds.filter(
      (storeId) => !validStoreIds.has(storeId)
    );

    if (invalidStores.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: `Invalid stores`,
      });
    }

    const totalStoreQty = storeQty.reduce(
      (total, store) => total + parseInt(store.Qty, 10),
      0
    );

    if (totalStoreQty > units) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Total store quantity exceeds available product stock",
      });
    }

    const product = await Product.create(
      {
        productName,
        manufacturer,
        units,
        type,
        drugs,
        storeQty,
        pricing,
        productStock: units,
        uom,
      },
      { transaction }
    );

    const marginPromise = ProductMargin.create(
      { ...marginPercentage, IID: product.IID },
      { transaction }
    );

    const storeProductEntries = storeQty.map((store) => ({
      IID: product.IID,
      SID: store.storeId,
      storeStock: store.Qty,
      units: product.uom,
    }));

    const storeProductPromise = StoreProduct.bulkCreate(
      storeProductEntries,
      { transaction }
    );

    const updatedProductStock = product.productStock - totalStoreQty;

    const updateProductStockPromise = Product.update(
      { productStock: updatedProductStock },
      { where: { IID: product.IID }, transaction }
    );

    try {
      await Promise.all([
        marginPromise,
        storeProductPromise,
        updateProductStockPromise,
      ]);
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: "Failed to process product details" });
    }

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "Product details created successfully." });
  } catch (error) {
    await transaction.rollback();
    const errorMessage = error?.errors?.[0]?.message || error?.message || "An unexpected error occurred.";
    console.error("Error creating product:", errorMessage);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const storeId = req?.query?.storeId || null
    const productId = req?.query?.productId || null
    const searchQuery = req.query.search || "";

    const offset = (page - 1) * limit;
    const whereConditions = {
      isProductDeleted: false,
        [Op.or]: [
          { productName: { [Op.iLike]: `%${searchQuery}%` } },
        ]
    };
    
    if (productId) {
      whereConditions.IID = productId; 
    }
    
    if (storeId) {
      whereConditions.storeQty = {
        [Sequelize.Op.contains]: [{ storeId: storeId }],
      };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [{ model: ProductMargin }],
      order: [["productName", "ASC"]],
      limit,
      offset,
    });

    const parsedProducts = products?.map(product => ({
      ...product.toJSON(),
      drugs: product?.drugs?.map(drug => {0.
        try {
          return JSON.parse(drug);
        } catch {
          return drug; // Return as is if not JSON
        }
      }),
    }));

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      products: parsedProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { marginPercentage, units, storeQty, productName, ...updatedData } = req.body;

  try {

    const [product, existingProduct] = await Promise.all([
      Product.findOne({ where: { IID: id } }),
      Product.findOne({ where: { productName: productName, IID: { [Op.ne]: id }  } })
    ]);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    if (existingProduct) {
      return res.status(400).json({ error: "Product already exists" });
    }   

    if (units) {
      const newProductStock = units;
      updatedData.units = newProductStock;
      updatedData.productStock = newProductStock;
      updatedData.productName = productName;
    }

    await product.update(updatedData);

    if (marginPercentage) {
      const [productMargin, created] = await ProductMargin.findOrCreate({
        where: { IID: id },
        defaults: {
          ...marginPercentage,
          IID: id,
        },
      });

      if (!created) {
        await productMargin.update(marginPercentage);
      }
    }

    let totalStoreStockBefore = 0;
    const storeProducts = await StoreProduct.findAll({
      where: { IID: id }
    })
    if (storeProducts.length > 0) {
      totalStoreStockBefore = storeProducts?.reduce((acc, storeProduct) => acc + storeProduct.storeStock, 0);
    }

    if (storeQty) {
      // const updatedStoreQty = [...product?.storeQty];
      // console.log("updatedStoreQty=====", updatedStoreQty)
      for (const { storeId, Qty } of storeQty) {
        const [storeProduct, created] = await StoreProduct.findOrCreate({
          where: { IID: id, SID: storeId },
          defaults: {
            IID: id,
            SID: storeId,
            storeStock: Qty,
            units: product.uom
          },
        });
        // console.log("storeProduct======", storeProduct)

        if (!created) {
          // If it already exists, update the stock quantity
          await storeProduct.update({ storeStock: Qty });
        }

        // const existingStoreIndex = updatedStoreQty?.findIndex(item => { 
        //   return item.storeId === storeId;
        // });
        // if (existingStoreIndex >= 0) {
        //   updatedStoreQty[existingStoreIndex].Qty = Qty; 
        // } else {
        //   updatedStoreQty.push({ storeId, Qty }); 
        // }
      }
      let totalStoreStockAfter = 0;
      const storeProductsAfter = await StoreProduct.findAll({
        where: { IID: id },
      });
  
      if (storeProductsAfter.length > 0) {
        totalStoreStockAfter = storeProductsAfter.reduce(
          (acc, storeProduct) => acc + storeProduct.storeStock,
          0
        );
      }
      console.log("totalStoreStockAfter====", totalStoreStockAfter);
      const stockDifference = totalStoreStockAfter - totalStoreStockBefore;
      if (stockDifference > 0) {
        // If total store stock after update is greater, subtract from productStock
        await product.update({
          productStock: product.productStock - stockDifference,
        });
      }
      // console.log("updatedStoreQty=======================", updatedStoreQty)
      // product.storeQty = updatedStoreQty;
      // product.changed('storeQty', true);
      // await product.save();
    }

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);
    const totalStoreStock = await StoreProduct.sum('storeStock', {
      where: { IID: product.IID },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if(product.productStock !== 0 && totalStoreStock !== 0) {
      return res.status(400).json({ message: "Cannot delete. Product and store stock is available." });
    }

    if(product.productStock !== 0) {
      return res.status(400).json({ message: "Cannot delete. Product stock is available." });
    }

    if(totalStoreStock !== 0) {
      return res.status(400).json({ message: "Cannot delete. Store stock is available." });
    }

    const associatedOrders = await OrderProduct.findAll({
      where: { IID: product?.IID },
      include: {
        model: Order,
        attributes: ["isAccepted", "OID"],
      },
    });

    const pendingOrders = associatedOrders?.filter((orderProduct) => {
      return orderProduct.order && !orderProduct.order.isAccepted;
    });

    if (pendingOrders.length > 0) {
      return res.status(400).json({
        message: "Cannot delete product. Some orders are not yet accepted.",
        pendingOrders: pendingOrders.map((order) => order.order.OID),
      });
    }

    await product.update({
      isProductDeleted: true,
    });
    
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProduct = async (req, res) => {
  const searchQuery = req.query.search || "";

  try {
    const products = await Product.findAll({
      where: {
        [Op.or]: [{ productName: { [Op.iLike]: `%${searchQuery}%` } }],
      },
      include: [{ model: ProductMargin }, { model: StoreProduct }],
      order: [["productName", "ASC"]],
    });

    res.status(200).json(products || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchDrug = async (req, res) => {
  const searchQuery = req.query.search || "";

  try {
    const products = await Product.findAll({
      where: Sequelize.literal(`
        EXISTS (
          SELECT 1
          FROM unnest(drugs) AS drug
          WHERE drug ILIKE '%${searchQuery}%'
        )
      `),
      order: [["productName", "ASC"]],
    });

    const filteredProducts = products.map((product) => {
      const matchingDrugs = product.drugs.filter((drug) =>
        drug.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...product.toJSON(),
        drugs: matchingDrugs,
      };
    });

    res.status(200).json(filteredProducts || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDrug = async (req, res) => {
  try {
    const { drugName } = req.body;
     await Drug.create({ drugName });

    return res
      .status(201)
      .json({ message: "Drug created successfully." });
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || "An unexpected error occurred.";
    console.error("Error creating drug:", errorMessage);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateDrug = async (req, res) => {
  try {
    const { id } = req.params; 
    const { drugName } = req.body; 
    const drug = await Drug.findByPk(id);
    if (!drug) {
      return res.status(404).json({ message: "Drug not found" });
    }
    await drug.update({ drugName });
    return res.status(200).json({ message: "Drug updated successfully." });
  } catch (error) {
    const errorMessage = error?.errors?.[0]?.message || error?.message || "An unexpected error occurred.";
    console.error("Error updating drug:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

exports.getAllDrugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || "";

    const offset = (page - 1) * limit;
    const whereConditions = {
        [Op.or]: [
          { drugName: { [Op.iLike]: `%${searchQuery}%` } },
        ]
    };
    
    const { count, rows: drugs } = await Drug.findAndCountAll({
      where: whereConditions,
      order: [["drugName", "ASC"]],
      limit,
      offset,
    });

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      drugs: drugs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDrug = async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await Drug.findByPk(id);
    if (!drug) {
      return res.status(404).json({ message: "Drug not found" });
    }
    await Drug.destroy({ where: { id } });
    return res.status(200).json({ message: "Drug deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
