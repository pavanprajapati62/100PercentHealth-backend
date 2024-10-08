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
      productId,
      productName,
      manufacturer,
      units,
      type,
      drugs,
      storeQty,
      marginPercentage,
      pricing,
    } = req.body;

    const existingProduct = await Product.findOne({
      where: { IID: productId },
    });

    if (existingProduct) {
      return res.status(404).json({ error: "Product id already exist" });
    }

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

    const product = await Product.create({
      IID: productId,
      productName,
      manufacturer,
      units,
      type,
      drugs,
      storeQty,
      pricing,
    }, { transaction });

    await ProductMargin.create({ ...marginPercentage, IID: product.IID }, { transaction });

    const storeProductEntries = storeQty.map((store) => ({
      IID: product.IID,
      SID: store.storeId,
    }));
    await StoreProduct.bulkCreate(storeProductEntries, { transaction });

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
  const updatedData = req.body;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.update(updatedData);
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
      include: [{ model: ProductMargin }]
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
