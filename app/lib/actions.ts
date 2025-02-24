"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const formSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.date(),
});

const CreateInvoice = formSchema.omit({ id: true, date: true });
const UpdateInvoice = formSchema.omit({ id: true, date: true });
const DeleteInvoice = formSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  await sql`INSERT INTO invoices (customer_id,amount,status,date)
  VALUES (${customerId},${amountInCents},${status},${date})`;
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
export async function updateInvoice(formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Invalid ID");
  }
  await sql`UPDATE invoices
  SET customer_id = ${customerId},
  amount = ${amountInCents},
  status = ${status} WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
export async function deleteInvoice(formData: FormData) {
  const id = DeleteInvoice.parse({ id: formData.get("id") });
  `await sql DELETE FROM invoices WHERE id =${id}`;
  revalidatePath("/dashboard/invoices");
}
