import { TransactionForm } from "@/components/transactions/TransactionForm";

export default function AddCreditCardPage() {
  return <TransactionForm type="expense" title="รายการบัตรเครดิต" restrictToAccountType="credit_card" />;
}
