
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataPath = path.join(process.cwd(), 'data');
const ordersFilePath = path.join(dataPath, 'orders.json');

async function readOrders() {
  try {
    const data = await fs.readFile(ordersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeOrders(orders) {
  try {
    await fs.mkdir(dataPath, { recursive: true });
    await fs.copyFile(ordersFilePath, `${ordersFilePath}.bak`).catch(() => {});
    await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders:', error);
  }
}

export async function createOrder(cart) {
  const orders = await readOrders();
  const newOrder = {
    id: uuidv4(),
    ...cart,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  await writeOrders(orders);
  return { orderId: newOrder.id, paymentToken: null };
}

export async function getOrderById(id) {
  const orders = await readOrders();
  return orders.find((order) => order.id === id);
}

export async function getOrders() {
  return await readOrders();
}

export async function markOrderAsPaid(id) {
  const orders = await readOrders();
  const orderIndex = orders.findIndex((order) => order.id === id);
  if (orderIndex > -1) {
    orders[orderIndex].status = 'paid';
    await writeOrders(orders);
    return orders[orderIndex];
  }
  return null;
}

export async function updateOrderStatus(id, status) {
  const orders = await readOrders();
  const orderIndex = orders.findIndex((order) => order.id === id);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    await writeOrders(orders);
    return orders[orderIndex];
  }
  return null;
}
