const { MongoClient } = require("mongodb");
const { MONGO_DB } = require("../../../config");

const client = new MongoClient(MONGO_DB);

const db = client.db("QuizBot");
const chats = db.collection("chats");

async function check_if_chats_exists(chatid) {
    const chat = await chats.findOne({ "chat_id": chatid });
    return chat !== null; // Returns true if chat exists, false otherwise
}

async function add_chat(chatid, name) {
    const if_exists = await check_if_chat_exists(chatid);
    if (!if_exists) {
        await chats.insertOne({
            "chat_id": chatid,
            "name": name
        });
        console.log("Chat added successfully!");
    } else {
        console.log("Chat already exists. Skipping insertion.");
    }
}

async function find_chat(chatid) {
    const chat = await chats.findOne({ "chat_id": chatid });
    if (chat) {
        console.log("Chat found:", user);
        return chat;
    } else {
        console.log("No Chat found with the given user_id.");
        return null;
    }
}

async function get_total_chats() {
    const total_chats = await chats.countDocuments({});
    console.log("Total chats in the database:", total_users);
    return total_chats;
}

module.exports = {
    add_chat,
    get_total_chats
};



