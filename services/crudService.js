// services/crudService.js
const { ObjectId } = require('mongodb');
// const { connectDB } = require('../db/mongoClient');
const { getDB } = require('./../config/database')

async function getCollection(collectionName) {
    const db = await getDB();
    return db.collection(collectionName);
}

const CRUDService = {
    // CREATE
    async createOne(collectionName, data) {
        const collection = await getCollection(collectionName);
        const result = await collection.insertOne(data);
        return result.ops?.[0] || { insertedId: result.insertedId };
    },

    async createMany(collectionName, dataArray) {
        const collection = await getCollection(collectionName);
        const result = await collection.insertMany(dataArray);
        return result.insertedIds;
    },

    // READ
    async findOne(collectionName, query = {}, options = {}) {
        const collection = await getCollection(collectionName);
        return collection.findOne(query, options);
    },

    async findMany(collectionName, query = {}, options = {}) {
        const collection = await getCollection(collectionName);
        const cursor = collection.find(query, options);
        return cursor.toArray();
    },

    async findById(collectionName, id) {
        const collection = await getCollection(collectionName);
        return collection.findOne({ _id: new ObjectId(id) });
    },

    // UPDATE
    async updateOne(collectionName, query, updateDoc, options = {}) {
        const collection = await getCollection(collectionName);
        return collection.updateOne(query, { $set: updateDoc }, options);
    },

    async updateMany(collectionName, query, updateDoc, options = {}) {
        const collection = await getCollection(collectionName);
        return collection.updateMany(query, { $set: updateDoc }, options);
    },

    async updateById(collectionName, id, updateDoc, options = {}) {
        const collection = await getCollection(collectionName);
        return collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc }, options);
    },

    // DELETE
    async deleteOne(collectionName, query) {
        const collection = await getCollection(collectionName);
        return collection.deleteOne(query);
    },

    async deleteMany(collectionName, query) {
        const collection = await getCollection(collectionName);
        return collection.deleteMany(query);
    },

    async deleteById(collectionName, id) {
        const collection = await getCollection(collectionName);
        return collection.deleteOne({ _id: new ObjectId(id) });
    },

    async findAndUpdate(collectionName, query, updateDoc, options = {}) {
        const collection = await getCollection(collectionName);
        const result = await collection.findOneAndUpdate(
            query,
            { $set: updateDoc },
            {
                returnDocument: 'after', // return the updated document
                ...options,
            }
        );
        return result.value; // this is the updated document
    },

    // Find and Delete
    async findAndDelete(collectionName, query, options = {}) {
        const collection = await getCollection(collectionName);
        const result = await collection.findOneAndDelete(query, options);
        return result.value;
    },

    // Find and Replace
    async findAndReplace(collectionName, query, replacementDoc, options = {}) {
        const collection = await getCollection(collectionName);
        const result = await collection.findOneAndReplace(query, replacementDoc, {
            returnDocument: 'after',
            ...options,
        });
        return result.value;
    },

    // Replace One (full replacement)
    async replaceOne(collectionName, query, replacementDoc, options = {}) {
        const collection = await getCollection(collectionName);
        return collection.replaceOne(query, replacementDoc, options);
    },

    // Count
    async count(collectionName, query = {}) {
        const collection = await getCollection(collectionName);
        return collection.countDocuments(query);
    },

    // Distinct
    async distinct(collectionName, key, query = {}) {
        const collection = await getCollection(collectionName);
        return collection.distinct(key, query);
    },

    // Bulk Write
    async bulkWrite(collectionName, operations = [], options = {}) {
        const collection = await getCollection(collectionName);
        return collection.bulkWrite(operations, options);
    },

    // Aggregation
    async aggregate(collectionName, pipeline = [], options = {}) {
        const collection = await getCollection(collectionName);
        const cursor = collection.aggregate(pipeline, options);
        return cursor.toArray();
    }

};

module.exports = CRUDService;
