// Extended Mock Data for SKMEI.LB Watch Store
import { Order, Customer, OrderStatus, Address } from "@/types";

// Mock Orders Data
export const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    orderNumber: "SK-001-2024",
    customer: {
      id: "CUST-001",
      email: "ahmad.hassan@email.com",
      firstName: "Ahmad",
      lastName: "Hassan",
      phone: "+961 70 123 456",
      addresses: [],
      createdAt: "2024-01-15T10:00:00Z",
    },
    items: [
      {
        productId: "skmei-1251",
        productName: "SKMEI 1251 Digital Sports Watch",
        quantity: 2,
        price: 25.99,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      },
    ],
    status: "delivered" as OrderStatus,
    subtotal: 51.98,
    shipping: 0,
    tax: 0,
    total: 51.98,
    shippingAddress: {
      id: "ADDR-001",
      firstName: "Ahmad",
      lastName: "Hassan",
      street: "Mar Elias Street, Building 12",
      city: "Beirut",
      state: "Beirut",
      country: "Lebanon",
      postalCode: "1107",
      phone: "+961 70 123 456",
      isDefault: true,
    },
    paymentMethod: "Cash on Delivery",
    notes: "Please call before delivery",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-18T14:30:00Z",
  },
  {
    id: "ORD-2024-002",
    orderNumber: "SK-002-2024",
    customer: {
      id: "CUST-002",
      email: "layla.khoury@email.com",
      firstName: "Layla",
      lastName: "Khoury",
      phone: "+961 71 234 567",
      addresses: [],
      createdAt: "2024-01-10T08:00:00Z",
    },
    items: [
      {
        productId: "skmei-w30",
        productName: "SKMEI W30 Smart Watch",
        quantity: 1,
        price: 65.99,
        image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400",
      },
    ],
    status: "shipped" as OrderStatus,
    subtotal: 65.99,
    shipping: 5.00,
    tax: 0,
    total: 70.99,
    shippingAddress: {
      id: "ADDR-002",
      firstName: "Layla",
      lastName: "Khoury",
      street: "Hamra Street, Apt 5",
      city: "Beirut",
      state: "Beirut",
      country: "Lebanon",
      postalCode: "1103",
      phone: "+961 71 234 567",
      isDefault: true,
    },
    paymentMethod: "Credit Card",
    createdAt: "2024-01-20T11:00:00Z",
    updatedAt: "2024-01-22T09:15:00Z",
  },
  {
    id: "ORD-2024-003",
    orderNumber: "SK-003-2024",
    customer: {
      id: "CUST-003",
      email: "karim.farah@email.com",
      firstName: "Karim",
      lastName: "Farah",
      phone: "+961 76 345 678",
      addresses: [],
      createdAt: "2023-12-20T14:00:00Z",
    },
    items: [
      {
        productId: "skmei-9305",
        productName: "SKMEI 9305 Luxury Chronograph",
        quantity: 1,
        price: 89.99,
        image: "https://images.unsplash.com/photo-1585159812596-fac104f2e069?w=400",
      },
      {
        productId: "skmei-1358",
        productName: "SKMEI 1358 Compass Sports",
        quantity: 1,
        price: 39.99,
        image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400",
      },
    ],
    status: "processing" as OrderStatus,
    subtotal: 129.98,
    shipping: 0,
    tax: 0,
    total: 129.98,
    shippingAddress: {
      id: "ADDR-003",
      firstName: "Karim",
      lastName: "Farah",
      street: "Verdun Street, Building 8",
      city: "Beirut",
      state: "Beirut",
      country: "Lebanon",
      postalCode: "1105",
      phone: "+961 76 345 678",
      isDefault: true,
    },
    paymentMethod: "Cash on Delivery",
    createdAt: "2024-01-22T15:30:00Z",
    updatedAt: "2024-01-23T10:00:00Z",
  },
  {
    id: "ORD-2024-004",
    orderNumber: "SK-004-2024",
    customer: {
      id: "CUST-004",
      email: "sara.mahmoud@email.com",
      firstName: "Sara",
      lastName: "Mahmoud",
      phone: "+961 3 456 789",
      addresses: [],
      createdAt: "2024-01-05T09:00:00Z",
    },
    items: [
      {
        productId: "skmei-1464",
        productName: "SKMEI 1464 Minimalist Watch",
        quantity: 2,
        price: 29.99,
        image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400",
      },
    ],
    status: "confirmed" as OrderStatus,
    subtotal: 59.98,
    shipping: 0,
    tax: 0,
    total: 59.98,
    shippingAddress: {
      id: "ADDR-004",
      firstName: "Sara",
      lastName: "Mahmoud",
      street: "Achrafieh, Mar Mikhael",
      city: "Beirut",
      state: "Beirut",
      country: "Lebanon",
      postalCode: "1100",
      phone: "+961 3 456 789",
      isDefault: true,
    },
    paymentMethod: "Cash on Delivery",
    createdAt: "2024-01-24T12:00:00Z",
    updatedAt: "2024-01-24T13:30:00Z",
  },
  {
    id: "ORD-2024-005",
    orderNumber: "SK-005-2024",
    customer: {
      id: "CUST-005",
      email: "michel.nassar@email.com",
      firstName: "Michel",
      lastName: "Nassar",
      phone: "+961 70 567 890",
      addresses: [],
      createdAt: "2024-01-18T16:00:00Z",
    },
    items: [
      {
        productId: "skmei-w37",
        productName: "SKMEI W37 Pro Smartwatch",
        quantity: 1,
        price: 99.99,
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400",
      },
    ],
    status: "pending" as OrderStatus,
    subtotal: 99.99,
    shipping: 0,
    tax: 0,
    total: 99.99,
    shippingAddress: {
      id: "ADDR-005",
      firstName: "Michel",
      lastName: "Nassar",
      street: "Dbayeh Highway, Metn",
      city: "Dbayeh",
      state: "Mount Lebanon",
      country: "Lebanon",
      postalCode: "1200",
      phone: "+961 70 567 890",
      isDefault: true,
    },
    paymentMethod: "Credit Card",
    createdAt: "2024-01-25T08:45:00Z",
    updatedAt: "2024-01-25T08:45:00Z",
  },
];

// Mock Customers Data
export const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    email: "ahmad.hassan@email.com",
    firstName: "Ahmad",
    lastName: "Hassan",
    phone: "+961 70 123 456",
    addresses: [
      {
        id: "ADDR-001",
        firstName: "Ahmad",
        lastName: "Hassan",
        street: "Mar Elias Street, Building 12",
        city: "Beirut",
        state: "Beirut",
        country: "Lebanon",
        postalCode: "1107",
        phone: "+961 70 123 456",
        isDefault: true,
      },
    ],
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "CUST-002",
    email: "layla.khoury@email.com",
    firstName: "Layla",
    lastName: "Khoury",
    phone: "+961 71 234 567",
    addresses: [
      {
        id: "ADDR-002",
        firstName: "Layla",
        lastName: "Khoury",
        street: "Hamra Street, Apt 5",
        city: "Beirut",
        state: "Beirut",
        country: "Lebanon",
        postalCode: "1103",
        phone: "+961 71 234 567",
        isDefault: true,
      },
    ],
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "CUST-003",
    email: "karim.farah@email.com",
    firstName: "Karim",
    lastName: "Farah",
    phone: "+961 76 345 678",
    addresses: [
      {
        id: "ADDR-003",
        firstName: "Karim",
        lastName: "Farah",
        street: "Verdun Street, Building 8",
        city: "Beirut",
        state: "Beirut",
        country: "Lebanon",
        postalCode: "1105",
        phone: "+961 76 345 678",
        isDefault: true,
      },
    ],
    createdAt: "2023-12-20T14:00:00Z",
  },
  {
    id: "CUST-004",
    email: "sara.mahmoud@email.com",
    firstName: "Sara",
    lastName: "Mahmoud",
    phone: "+961 3 456 789",
    addresses: [
      {
        id: "ADDR-004",
        firstName: "Sara",
        lastName: "Mahmoud",
        street: "Achrafieh, Mar Mikhael",
        city: "Beirut",
        state: "Beirut",
        country: "Lebanon",
        postalCode: "1100",
        phone: "+961 3 456 789",
        isDefault: true,
      },
    ],
    createdAt: "2024-01-05T09:00:00Z",
  },
  {
    id: "CUST-005",
    email: "michel.nassar@email.com",
    firstName: "Michel",
    lastName: "Nassar",
    phone: "+961 70 567 890",
    addresses: [
      {
        id: "ADDR-005",
        firstName: "Michel",
        lastName: "Nassar",
        street: "Dbayeh Highway, Metn",
        city: "Dbayeh",
        state: "Mount Lebanon",
        country: "Lebanon",
        postalCode: "1200",
        phone: "+961 70 567 890",
        isDefault: true,
      },
    ],
    createdAt: "2024-01-18T16:00:00Z",
  },
];

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  recentOrders: Order[];
  topProducts: Array<{
    id: string;
    rank: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export const dashboardStats: DashboardStats = {
  totalRevenue: 12458.50,
  totalOrders: 87,
  totalCustomers: 42,
  totalProducts: 45,
  revenueChange: 12.5,
  ordersChange: 8.3,
  customersChange: 15.2,
  productsChange: 5.0,
  recentOrders: mockOrders.slice(0, 5),
  topProducts: [
    {
      id: "skmei-1251",
      rank: 1,
      name: "SKMEI 1251 Digital Sports",
      sales: 45,
      revenue: 1169.55,
    },
    {
      id: "skmei-w30",
      rank: 2,
      name: "SKMEI W30 Smart Watch",
      sales: 32,
      revenue: 2111.68,
    },
    {
      id: "skmei-9305",
      rank: 3,
      name: "SKMEI 9305 Luxury Chronograph",
      sales: 28,
      revenue: 2519.72,
    },
    {
      id: "skmei-1464",
      rank: 4,
      name: "SKMEI 1464 Minimalist",
      sales: 38,
      revenue: 1139.62,
    },
  ],
};

// Helper Functions
export const getOrders = (): Order[] => mockOrders;

export const getOrderById = (id: string): Order | undefined =>
  mockOrders.find((order) => order.id === id);

export const getCustomers = (): Customer[] => mockCustomers;

export const getCustomerById = (id: string): Customer | undefined =>
  mockCustomers.find((customer) => customer.id === id);

export const getDashboardStats = (): DashboardStats => dashboardStats;

export const getOrdersByStatus = (status: OrderStatus): Order[] =>
  mockOrders.filter((order) => order.status === status);

export const getCustomerOrders = (customerId: string): Order[] =>
  mockOrders.filter((order) => order.customer.id === customerId);
