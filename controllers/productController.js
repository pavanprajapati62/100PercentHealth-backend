const { Op, Sequelize } = require("sequelize");
const Product = require("../models/Product/Product");
const StoreProduct = require("../models/Product/StoreProduct");
const Store = require("../models/Store/Store");
const ProductMargin = require("../models/Product/ProductMargin");
const { sequelize } = require("../config/db");

exports.createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
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
      uom
    } = req.body;

    const uniqueStoreIds = [...new Set(storeQty.map((store) => store.storeId))];

    const stores = await Store.findAll({
      where: {
        SID: uniqueStoreIds,
      },
    });

    const validStoreIds = new Set(stores.map((store) => store.SID));

    const invalidStores = uniqueStoreIds.filter(
      (storeId) => !validStoreIds.has(storeId)
    );

    if (invalidStores.length > 0) {
      return res.status(400).json({
        error: `Store ID(s) do not exist: ${invalidStores.join(", ")}`,
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

    await ProductMargin.create(
      { ...marginPercentage, IID: product.IID },
      { transaction }
    );

    const storeProductEntries = storeQty.map((store) => ({
      IID: product.IID,
      SID: store.storeId,
      // productName: product.productName,
      storeStock: store.Qty,
      units: product.uom,
    }));
    await StoreProduct.bulkCreate(storeProductEntries, { transaction });

    const totalStoreQty = storeQty.reduce((total, store) => total + parseInt(store.Qty, 10), 0);
    const updatedProductStock = product.productStock - totalStoreQty;

    await Product.update(
      { productStock: updatedProductStock },
      { where: { IID: product.IID }, transaction }
    );

    await transaction.commit();

    res.status(201).json({ message: "Product details created successfully." });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      include: [{ model: ProductMargin }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      products,
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
  const { marginPercentage, units, storeQty, ...updatedData } = req.body;
  console.log("updatedData================", updatedData)

  try {
    const product = await Product.findOne({
      where: { IID: id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (units) {
      const newProductStock = units;
      updatedData.units = newProductStock;
      updatedData.productStock = newProductStock;
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
    console.log("totalStoreStockBefore=====", totalStoreStockBefore)

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

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();
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
      order: [["createdAt", "DESC"]],
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
      order: [["createdAt", "DESC"]],
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
