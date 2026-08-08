import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function OrdersRevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#AE2108"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Orders"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Revenue (₦)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
