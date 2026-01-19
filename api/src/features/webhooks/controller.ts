import { Request, Response, NextFunction } from "express";
import { userRepository } from "@repository";
import axios from "axios";

const sendToCDP = async (storeId: number, eventName: string, properties: any, userId?: string) => {
    const user = userRepository.findOne(storeId);
    if (!user || !user.cdp_write_key) {
        console.log(`[CDP] Skipping event ${eventName} for store ${storeId}: No Write Key configured.`);
        return;
    }

    const endpoint = user.region_center === 'EU' 
        ? 'https://cdp-eu.customer.io/v1/track' 
        : 'https://cdp.customer.io/v1/track';
    
    const auth = Buffer.from(`${user.cdp_write_key}:`).toString('base64');

    try {
        await axios.post(endpoint, {
            userId: userId ? String(userId) : undefined,
            anonymousId: !userId ? 'anonymous_webhook_user' : undefined,
            event: eventName,
            properties,
            context: {
                library: {
                    name: 'tiendanube-native-app',
                    version: '1.0.0'
                }
            }
        }, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`[CDP] Sent event ${eventName} for store ${storeId}`);
    } catch (err: any) {
        console.error(`[CDP] Error sending event ${eventName}:`, err.message);
    }
};

export const handleOrderCreated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { store_id, id, total, currency, products, customer } = req.body;
        // Assuming req.body contains the order object directly + store_id
        
        await sendToCDP(Number(store_id), "Order Completed", {
            order_id: id,
            total,
            currency,
            products
        }, customer?.id);

        res.status(200).send("OK");
    } catch (e) {
        next(e);
    }
};

export const handleOrderPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { store_id, id, total, customer } = req.body;
        await sendToCDP(Number(store_id), "Order Paid", {
            order_id: id,
            total
        }, customer?.id);
        res.status(200).send("OK");
    } catch (e) {
        next(e);
    }
};

export const handleOrderCancelled = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { store_id, id, customer } = req.body;
        await sendToCDP(Number(store_id), "Order Cancelled", {
            order_id: id
        }, customer?.id);
        res.status(200).send("OK");
    } catch (e) {
        next(e);
    }
};
