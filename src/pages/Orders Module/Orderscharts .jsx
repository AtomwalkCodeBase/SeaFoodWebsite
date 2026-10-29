// pages/orders/OrdersCharts.jsx
import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import Card from '../../components/Card';
import { SectionHeader } from '../../components/EmptyState';
// import { toMt } from './Orderhelpers';

const DEMAND_BY_DESTINATION_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const DEMAND_BY_PRODUCT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff6b6b', '#4ecdc4', '#45b7d1'];

const OrdersCharts = ({ orderList = [], productList = [], ordersByDestinationList = [] }) => {
    const data = useMemo(() => {
        const map = new Map();

        orderList.forEach((order) => {
            const productId = Number(order.product?.id ?? order.product);

            const product = productList.find(
                (item) => Number(item.id) === productId
            );

            const unit = product?.base_unit || "MT";
            const productName = order.product_name || product?.product_name || "Unknown";

            // const qtyMT = toMt(order.quantity_mt, unit);
            const qtyMT = Number(order.quantity_mt);

            map.set(productName, (map.get(productName) || 0) + qtyMT);
        });

        return Array.from(map.entries())
            .map(([product_name, total_mt]) => ({ product_name, total_mt }))
            .sort((a, b) => b.total_mt - a.total_mt);
    }, [orderList, productList]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <SectionHeader title="Demand by destination" icon="🌍" />
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={ordersByDestinationList}
                            dataKey="total_mt"
                            nameKey="destination_country"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `${entry.destination_country}: ${entry.total_mt} MT`}
                            fontSize={11}
                        >
                            {ordersByDestinationList.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={DEMAND_BY_DESTINATION_COLORS[index % DEMAND_BY_DESTINATION_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} MT`} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <SectionHeader title="Demand by product" icon="📦" />
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart layout="vertical" data={data}>
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="product_name" width={90} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} MT`, 'Total in mt']} />
                        <Bar dataKey="total_mt" barSize={20}>
                            <LabelList
                                dataKey="total_mt"
                                position="right"
                                formatter={(value) => `${value} MT`}
                                style={{ fill: '#333', fontSize: 10, fontWeight: 'bold' }}
                            />
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={DEMAND_BY_PRODUCT_COLORS[index % DEMAND_BY_PRODUCT_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default OrdersCharts;