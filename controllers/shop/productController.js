const asyncHandler = require("express-async-handler");
const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const validateMongoDbId = require("../../utils/validateMongodbId");
const shuffleArray = require("../../utils/shuffleProducts");

/**
 * Shop page Route
 * Method GET
 */
exports.shoppage = asyncHandler(async (req, res) => {
    try {
        const queryOptions = { isListed: true };
        const messages = req.flash();
        const { search, category, page, perPage, sortBy } = req.query;

        if (search) {
            queryOptions.$or = [
                { title: { $regex: new RegExp(search, "i") } },
                { color: { $regex: new RegExp(search, "i") } },
                { material: { $regex: new RegExp(search, "i") } },
                { artForm: { $regex: new RegExp(search, "i") } },
            ];
        }

        if (category) {
            queryOptions.category = category;
        }

        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(perPage) || 8;
        const allProducts = await Product.find(queryOptions).populate("images").exec();

        // Shuffle all products randomly
        shuffleArray(allProducts);

        // Apply pagination to the shuffled products
        const skip = (currentPage - 1) * itemsPerPage;
        const products = allProducts.slice(skip, skip + itemsPerPage);

        // Apply sorting to the paginated products
        const sortOptions = {};
        if (sortBy === "az") {
            sortOptions.title = 1;
        } else if (sortBy === "za") {
            sortOptions.title = -1;
        } else if (sortBy === "price-asc") {
            sortOptions.salePrice = 1;
        } else if (sortBy === "price-desc") {
            sortOptions.salePrice = -1;
        }

        products.sort((a, b) => {
            if (sortOptions.title) {
                return a.title.localeCompare(b.title) * sortOptions.title;
            } else if (sortOptions.salePrice) {
                return (a.salePrice - b.salePrice) * sortOptions.salePrice;
            }
            return 0;
        });

        const totalProductsCount = allProducts.length;

        const categories = await Category.find({ isListed: true });

        res.render("shop/pages/products/shop", {
            title: "Shop",
            page: "shop",
            products,
            categories,
            search,
            category,
            currentPage,
            itemsPerPage,
            totalProductsCount,
            sortBy,
            messages,
        });
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * Single Prodcut page Route
 * Method GET
 */
exports.singleProductpage = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    validateMongoDbId(id);
    try {
        const messages = req.flash();
        const product = await Product.findById(id).populate("images").exec();
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
        })
            .populate("images")
            .exec();
        res.render("shop/pages/products/product", {
            title: "Product",
            page: "product",
            relatedProducts,
            product,
            messages,
            user,
        });
    } catch (error) {
        throw new Error(error);
    }
});
