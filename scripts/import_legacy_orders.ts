import fs from 'fs';
import { getDb } from '../server/db'; 
import { orders, orderItems, users, loyaltyHistory, loyaltyPoints } from '../drizzle/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';

const JSON_FILE = 'orders-2026-02-04-13-11-07.json';

// ✅ Lista dos pedidos que faltaram
const TARGET_ORDERS = ['29796', '29799', '29786'];

async function runImport() {
  const db = await getDb();

  
  const rawData = fs.readFileSync(JSON_FILE, 'utf8');
  const legacyOrders = JSON.parse(rawData);

  // Filtra apenas os pedidos alvo
  const filteredOrders = legacyOrders.filter((o: any) => TARGET_ORDERS.includes(String(o.order_number)));

  

  for (const legacy of filteredOrders) {
    try {
      const userEmail = legacy.billing_email.toLowerCase().trim();
      
      const userRecord = await db.query.users.findFirst({
        where: eq(users.email, userEmail)
      });

      if (!userRecord) {
        
        continue;
      }

      const fullOrderId = `GS-${legacy.order_number}`;
      const totalAmount = parseFloat(String(legacy.order_total).replace(',', '.'));
      const pointsToEarn = Math.floor(totalAmount);

      await db.transaction(async (tx) => {
        // A. Cabeçalho
        await tx.insert(orders).values({
          id: fullOrderId,
          userId: userRecord.id,
          status: 'completed',
          subtotal: legacy.order_subtotal.toString(),
          total: totalAmount.toString(),
          paymentMethod: 'Importação Legado',
          paymentStatus: 'paid',
          customerName: legacy.billing_full_name || legacy.billing_first_name, 
          createdAt: parseDate(legacy.order_date),
        });

        // B. Itens
        for (const prod of legacy.products) {
          const accompaniments = [
            prod["Acompanhamento 120g"],
            prod["Acompanhamento 100g"],
            prod["Acompanhamento 80g"]
          ].filter(v => v && v.trim() !== "");

          await tx.insert(orderItems).values({
            id: uuidv4(),
            orderId: fullOrderId,
            dishName: prod.name,
            quantity: parseInt(prod.qty) || 1,
            unitPrice: parseFloat(String(prod.item_price).replace(',', '.')).toString(),
            totalPrice: parseFloat(String(prod.price).replace(',', '.')).toString(),
            options: JSON.stringify({ accompaniments, legacy_import: true })
          });
        }

        // C. Fidelidade
        await tx.insert(loyaltyHistory).values({
          id: uuidv4(),
          userId: userRecord.id,
          orderId: fullOrderId,
          pointsChange: pointsToEarn,
          type: 'earned',
          reason: 'purchase',
          description: `Pontos importados do histórico (Pedido #${fullOrderId})`,
          createdAt: parseDate(legacy.order_date),
        });

        // D. Wallet
        await tx.insert(loyaltyPoints)
          .values({
            userId: userRecord.id,
            availablePoints: pointsToEarn,
            totalEarned: pointsToEarn,
          })
          .onDuplicateKeyUpdate({
            set: {
              availablePoints: sql`${loyaltyPoints.availablePoints} + ${pointsToEarn}`,
              totalEarned: sql`${loyaltyPoints.totalEarned} + ${pointsToEarn}`,
              updatedAt: new Date()
            }
          });
      });

      

    } catch (err: any) {
      
    }
  }

  
  process.exit(0);
}

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/');
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

runImport();