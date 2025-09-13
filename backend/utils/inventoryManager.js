const Inventory = require('../models/Inventory');

class InventoryManager {
  static async updateInventory(itemId, quantity) {
    try {
      const item = await Inventory.findById(itemId);
      if (!item) throw new Error('Item not found');

      item.quantity -= quantity;
      if (item.quantity < 0) throw new Error('Insufficient stock');

      await item.save();
      return item;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  static async checkStock(itemId) {
    try {
      const item = await Inventory.findById(itemId);
      return item && item.inStock && item.quantity > 0;
    } catch (error) {
      console.error('Error checking stock:', error);
      throw error;
    }
  }

  static async getInventoryItems() {
    try {
      return await Inventory.find({ inStock: true });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }
}

module.exports = InventoryManager;