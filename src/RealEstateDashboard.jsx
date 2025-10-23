import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Edit2, Save, X, Trash2, Plus, RefreshCw, Download } from 'lucide-react';

const RealEstateDashboard = () => {
  // Apps Script Webhook for Two-Way Sync
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGY7jljs4CFbK1zS8qHtJ5yFTeoyleFHYCNNhaabL4XIIMQ1vLuJy6HV41xR4Bk0opkA/exec';

  // Complete transaction data - All 89 transactions
  const completeTransactionData = [
    // 2018 (5 transactions)
    { id: 'T2018-001', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "123 Desert View", city: "Palm Desert", listPrice: 850000, closingDate: "2018-03-15", closedPrice: 825000, gci: 20625, nci: 17341.41, status: "Closed", year: 2018 },
    { id: 'T2018-002', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "456 Mountain Ridge", city: "Rancho Mirage", listPrice: 1250000, closingDate: "2018-06-22", closedPrice: 1225000, gci: 30625, nci: 25754.69, status: "Closed", year: 2018 },
    { id: 'T2018-003', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "789 Fairway Dr", city: "La Quinta", listPrice: 975000, closingDate: "2018-08-10", closedPrice: 950000, gci: 23750, nci: 19971.88, status: "Closed", year: 2018 },
    { id: 'T2018-004', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "321 Palm Canyon", city: "Palm Springs", listPrice: 675000, closingDate: "2018-10-05", closedPrice: 660000, gci: 16500, nci: 13878.13, status: "Closed", year: 2018 },
    { id: 'T2018-005', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "654 Vista Point", city: "Indian Wells", listPrice: 1450000, closingDate: "2018-12-18", closedPrice: 1425000, gci: 35625, nci: 29959.38, status: "Closed", year: 2018 },
    
    // 2019 (14 transactions)
    { id: 'T2019-001', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "111 Canyon View", city: "Palm Desert", listPrice: 795000, closingDate: "2019-01-15", closedPrice: 780000, gci: 19500, nci: 16387.5, status: "Closed", year: 2019 },
    { id: 'T2019-002', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "222 Desert Rose", city: "Indian Wells", listPrice: 1875000, closingDate: "2019-02-10", closedPrice: 1850000, gci: 46250, nci: 38890.63, status: "Closed", year: 2019 },
    { id: 'T2019-003', propertyType: "Residential", clientType: "Seller", source: "Boomtown", address: "333 Palm Valley", city: "Palm Springs", listPrice: 925000, closingDate: "2019-03-05", closedPrice: 900000, gci: 22500, nci: 18928.13, status: "Closed", year: 2019 },
    { id: 'T2019-004', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "444 Mountain Crest", city: "Rancho Mirage", listPrice: 1625000, closingDate: "2019-04-20", closedPrice: 1600000, gci: 40000, nci: 33650, status: "Closed", year: 2019 },
    { id: 'T2019-005', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "555 Golf Club Dr", city: "La Quinta", listPrice: 1150000, closingDate: "2019-05-15", closedPrice: 1125000, gci: 28125, nci: 23660.94, status: "Closed", year: 2019 },
    { id: 'T2019-006', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "666 Sunset View", city: "Palm Desert", listPrice: 875000, closingDate: "2019-06-12", closedPrice: 850000, gci: 21250, nci: 17878.13, status: "Closed", year: 2019 },
    { id: 'T2019-007', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "777 Desert Bloom", city: "Rancho Mirage", listPrice: 1425000, closingDate: "2019-07-08", closedPrice: 1400000, gci: 35000, nci: 29450, status: "Closed", year: 2019 },
    { id: 'T2019-008', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "888 Canyon Ridge", city: "Indian Wells", listPrice: 2100000, closingDate: "2019-08-22", closedPrice: 2075000, gci: 51875, nci: 43634.38, status: "Closed", year: 2019 },
    { id: 'T2019-009', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "999 Palm Oasis", city: "Palm Springs", listPrice: 725000, closingDate: "2019-09-14", closedPrice: 710000, gci: 17750, nci: 14931.25, status: "Closed", year: 2019 },
    { id: 'T2019-010', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "1010 Valley Vista", city: "La Quinta", listPrice: 1550000, closingDate: "2019-10-10", closedPrice: 1525000, gci: 38125, nci: 32090.63, status: "Closed", year: 2019 },
    { id: 'T2019-011', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "1111 Desert Sun", city: "Palm Desert", listPrice: 995000, closingDate: "2019-11-03", closedPrice: 975000, gci: 24375, nci: 20503.13, status: "Closed", year: 2019 },
    { id: 'T2019-012', propertyType: "Residential", clientType: "Buyer", source: "Expired", address: "1212 Mountain View", city: "Rancho Mirage", listPrice: 1775000, closingDate: "2019-11-25", closedPrice: 1750000, gci: 43750, nci: 36809.38, status: "Closed", year: 2019 },
    { id: 'T2019-013', propertyType: "Residential", clientType: "Seller", source: "Open House", address: "1313 Golf Vista", city: "Indian Wells", listPrice: 1325000, closingDate: "2019-12-10", closedPrice: 1300000, gci: 32500, nci: 27343.75, status: "Closed", year: 2019 },
    { id: 'T2019-014', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "88 Via Santo Tomas", city: "Rancho Mirage", listPrice: 2250000, closingDate: "2019-12-28", closedPrice: 2225000, gci: 55625, nci: 46809.38, status: "Closed", year: 2019 },
    
    // 2020 (19 transactions)
    { id: 'T2020-001', propertyType: "Residential", clientType: "Buyer", source: "Zillow", address: "1515 Desert Jewel", city: "Palm Desert", listPrice: 950000, closingDate: "2020-01-12", closedPrice: 925000, gci: 23125, nci: 19457.81, status: "Closed", year: 2020 },
    { id: 'T2020-002', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "1616 Canyon Estates", city: "Rancho Mirage", listPrice: 1675000, closingDate: "2020-02-08", closedPrice: 1650000, gci: 41250, nci: 34717.19, status: "Closed", year: 2020 },
    { id: 'T2020-003', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "1717 Palm Springs Dr", city: "Indian Wells", listPrice: 2150000, closingDate: "2020-02-28", closedPrice: 2125000, gci: 53125, nci: 44698.44, status: "Closed", year: 2020 },
    { id: 'T2020-004', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "1818 Vista Grande", city: "La Quinta", listPrice: 1295000, closingDate: "2020-03-18", closedPrice: 1275000, gci: 31875, nci: 26817.19, status: "Closed", year: 2020 },
    { id: 'T2020-005', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "1919 Mountain Peak", city: "Palm Desert", listPrice: 1825000, closingDate: "2020-04-10", closedPrice: 1800000, gci: 45000, nci: 37856.25, status: "Closed", year: 2020 },
    { id: 'T2020-006', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "2020 Desert Breeze", city: "Rancho Mirage", listPrice: 975000, closingDate: "2020-05-05", closedPrice: 950000, gci: 23750, nci: 19981.25, status: "Closed", year: 2020 },
    { id: 'T2020-007', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "2121 Fairway Vista", city: "Indian Wells", listPrice: 2450000, closingDate: "2020-05-28", closedPrice: 2425000, gci: 60625, nci: 51003.13, status: "Closed", year: 2020 },
    { id: 'T2020-008', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "2222 Canyon Trail", city: "Palm Springs", listPrice: 825000, closingDate: "2020-06-15", closedPrice: 810000, gci: 20250, nci: 17035.31, status: "Closed", year: 2020 },
    { id: 'T2020-009', propertyType: "Residential", clientType: "Buyer", source: "Sphere", address: "40 Via Bella", city: "Rancho Mirage", listPrice: 2250000, closingDate: "2020-07-08", closedPrice: 2225000, gci: 55625, nci: 46809.38, status: "Closed", year: 2020 },
    { id: 'T2020-010', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "2424 Desert Sky", city: "La Quinta", listPrice: 1150000, closingDate: "2020-07-25", closedPrice: 1125000, gci: 28125, nci: 23660.94, status: "Closed", year: 2020 },
    { id: 'T2020-011', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "2525 Palm Court", city: "Palm Desert", listPrice: 1575000, closingDate: "2020-08-12", closedPrice: 1550000, gci: 38750, nci: 32615.63, status: "Closed", year: 2020 },
    { id: 'T2020-012', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "2626 Vista Ridge", city: "Indian Wells", listPrice: 1925000, closingDate: "2020-09-05", closedPrice: 1900000, gci: 47500, nci: 39965.63, status: "Closed", year: 2020 },
    { id: 'T2020-013', propertyType: "Residential", clientType: "Buyer", source: "Expired", address: "2727 Mountain Range", city: "Rancho Mirage", listPrice: 1375000, closingDate: "2020-09-28", closedPrice: 1350000, gci: 33750, nci: 28398.44, status: "Closed", year: 2020 },
    { id: 'T2020-014', propertyType: "Residential", clientType: "Seller", source: "Open House", address: "2828 Canyon View", city: "Palm Springs", listPrice: 895000, closingDate: "2020-10-15", closedPrice: 875000, gci: 21875, nci: 18403.13, status: "Closed", year: 2020 },
    { id: 'T2020-015', propertyType: "Residential", clientType: "Buyer", source: "Zillow", address: "2929 Desert Willow", city: "La Quinta", listPrice: 1725000, closingDate: "2020-11-03", closedPrice: 1700000, gci: 42500, nci: 35762.5, status: "Closed", year: 2020 },
    { id: 'T2020-016', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "3030 Palm Estates", city: "Palm Desert", listPrice: 1095000, closingDate: "2020-11-20", closedPrice: 1075000, gci: 26875, nci: 22617.19, status: "Closed", year: 2020 },
    { id: 'T2020-017', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "3131 Vista Point", city: "Indian Wells", listPrice: 2575000, closingDate: "2020-12-08", closedPrice: 2550000, gci: 63750, nci: 53659.38, status: "Closed", year: 2020 },
    { id: 'T2020-018', propertyType: "Residential", clientType: "Seller", source: "Boomtown", address: "3232 Canyon Creek", city: "Rancho Mirage", listPrice: 1225000, closingDate: "2020-12-18", closedPrice: 1200000, gci: 30000, nci: 25237.5, status: "Closed", year: 2020 },
    { id: 'T2020-019', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "3333 Desert Hills", city: "Palm Springs", listPrice: 975000, closingDate: "2020-12-28", closedPrice: 950000, gci: 23750, nci: 19981.25, status: "Closed", year: 2020 },
    
    // 2021 (26 transactions)
    { id: 'T2021-001', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "72 Ryder Cup Dr", city: "Rancho Mirage", listPrice: 1875000, closingDate: "2021-01-08", closedPrice: 1850000, gci: 46250, nci: 38880.31, status: "Closed", year: 2021 },
    { id: 'T2021-002', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "35 Saint John Pl", city: "Rancho Mirage", listPrice: 1325000, closingDate: "2021-01-22", closedPrice: 1300000, gci: 32500, nci: 27331.25, status: "Closed", year: 2021 },
    { id: 'T2021-003', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "40 Via Entrada", city: "Rancho Mirage", listPrice: 2250000, closingDate: "2021-02-15", closedPrice: 2200000, gci: 55000, nci: 46237.5, status: "Closed", year: 2021 },
    { id: 'T2021-004', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "76543 California Dr", city: "Palm Desert", listPrice: 825000, closingDate: "2021-02-28", closedPrice: 810000, gci: 20250, nci: 17020.31, status: "Closed", year: 2021 },
    { id: 'T2021-005', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "110 Lakeside Dr", city: "Rancho Mirage", listPrice: 1675000, closingDate: "2021-03-12", closedPrice: 1650000, gci: 41250, nci: 34678.13, status: "Closed", year: 2021 },
    { id: 'T2021-006', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "48700 Classic Dr", city: "La Quinta", listPrice: 1475000, closingDate: "2021-03-28", closedPrice: 1450000, gci: 36250, nci: 30470.31, status: "Closed", year: 2021 },
    { id: 'T2021-007', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "215 Kavenish Dr", city: "Rancho Mirage", listPrice: 1950000, closingDate: "2021-04-15", closedPrice: 1925000, gci: 48125, nci: 40465.63, status: "Closed", year: 2021 },
    { id: 'T2021-008', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "79100 Tom Fazio Ln", city: "La Quinta", listPrice: 2650000, closingDate: "2021-04-30", closedPrice: 2625000, gci: 65625, nci: 55193.75, status: "Closed", year: 2021 },
    { id: 'T2021-009', propertyType: "Residential", clientType: "Buyer", source: "Zillow", address: "78450 Via Carmel", city: "La Quinta", listPrice: 1195000, closingDate: "2021-05-18", closedPrice: 1175000, gci: 29375, nci: 24698.44, status: "Closed", year: 2021 },
    { id: 'T2021-010', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "49200 Rancho La Quinta", city: "La Quinta", listPrice: 3125000, closingDate: "2021-06-05", closedPrice: 3100000, gci: 77500, nci: 65181.25, status: "Closed", year: 2021 },
    { id: 'T2021-011', propertyType: "Residential", clientType: "Buyer", source: "Expired", address: "36 Dartmouth Dr", city: "Rancho Mirage", listPrice: 1425000, closingDate: "2021-06-22", closedPrice: 1400000, gci: 35000, nci: 29431.25, status: "Closed", year: 2021 },
    { id: 'T2021-012', propertyType: "Residential", clientType: "Seller", source: "Boomtown", address: "48 Clancy Ln", city: "Rancho Mirage", listPrice: 1850000, closingDate: "2021-07-10", closedPrice: 1825000, gci: 45625, nci: 38378.13, status: "Closed", year: 2021 },
    { id: 'T2021-013', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "77555 Tradition Dr", city: "La Quinta", listPrice: 2875000, closingDate: "2021-07-28", closedPrice: 2850000, gci: 71250, nci: 59928.75, status: "Closed", year: 2021 },
    { id: 'T2021-014', propertyType: "Residential", clientType: "Seller", source: "Open House", address: "90 Via Santo Tomas", city: "Rancho Mirage", listPrice: 2450000, closingDate: "2021-08-15", closedPrice: 2425000, gci: 60625, nci: 50993.75, status: "Closed", year: 2021 },
    { id: 'T2021-015', propertyType: "Residential", clientType: "Buyer", source: "Sphere", address: "73200 Somera Rd", city: "Palm Desert", listPrice: 1525000, closingDate: "2021-09-05", closedPrice: 1500000, gci: 37500, nci: 31537.5, status: "Closed", year: 2021 },
    { id: 'T2021-016', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "50 Astronomical Dr", city: "Rancho Mirage", listPrice: 1975000, closingDate: "2021-09-22", closedPrice: 1950000, gci: 48750, nci: 40993.75, status: "Closed", year: 2021 },
    { id: 'T2021-017', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "81 Kavenish Dr", city: "Rancho Mirage", listPrice: 2125000, closingDate: "2021-10-08", closedPrice: 2100000, gci: 52500, nci: 44156.25, status: "Closed", year: 2021 },
    { id: 'T2021-018', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "74 Ambassador Cir", city: "Rancho Mirage", listPrice: 3450000, closingDate: "2021-10-28", closedPrice: 3425000, gci: 85625, nci: 72021.88, status: "Closed", year: 2021 },
    { id: 'T2021-019', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "78750 Del Norte Ct", city: "La Quinta", listPrice: 1695000, closingDate: "2021-11-12", closedPrice: 1675000, gci: 41875, nci: 35203.13, status: "Closed", year: 2021 },
    { id: 'T2021-020', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "38 Via Las Palmas", city: "Rancho Mirage", listPrice: 2275000, closingDate: "2021-11-28", closedPrice: 2250000, gci: 56250, nci: 47296.88, status: "Closed", year: 2021 },
    { id: 'T2021-021', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "125 Waterford Cir", city: "Rancho Mirage", listPrice: 1825000, closingDate: "2021-12-10", closedPrice: 1800000, gci: 45000, nci: 37831.25, status: "Closed", year: 2021 },
    { id: 'T2021-022', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "49 Colgate Dr", city: "Rancho Mirage", listPrice: 2925000, closingDate: "2021-12-18", closedPrice: 2900000, gci: 72500, nci: 60956.25, status: "Closed", year: 2021 },
    { id: 'T2021-023', propertyType: "Residential", clientType: "Buyer", source: "Zillow", address: "78125 Calle Norte", city: "La Quinta", listPrice: 1475000, closingDate: "2021-12-22", closedPrice: 1450000, gci: 36250, nci: 30470.31, status: "Closed", year: 2021 },
    { id: 'T2021-024', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "4 Cresta Verde", city: "Rancho Mirage", listPrice: 2650000, closingDate: "2021-12-27", closedPrice: 2625000, gci: 65625, nci: 55193.75, status: "Closed", year: 2021 },
    { id: 'T2021-025', propertyType: "Residential", clientType: "Buyer", source: "Expired", address: "144 Waterford Cir", city: "Rancho Mirage", listPrice: 1775000, closingDate: "2021-12-29", closedPrice: 1750000, gci: 43750, nci: 36778.13, status: "Closed", year: 2021 },
    { id: 'T2021-026', propertyType: "Residential", clientType: "Seller", source: "Boomtown", address: "39400 Sweetwater Dr", city: "Palm Desert", listPrice: 1295000, closingDate: "2021-12-31", closedPrice: 1275000, gci: 31875, nci: 26803.13, status: "Closed", year: 2021 },
    
    // 2022 (12 transactions)
    { id: 'T2022-001', propertyType: "Residential", clientType: "Buyer", source: "Past Client", address: "77 Calle de Sueños", city: "Palm Desert", listPrice: 1625000, closingDate: "2022-01-15", closedPrice: 1600000, gci: 40000, nci: 33625, status: "Closed", year: 2022 },
    { id: 'T2022-002', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "50 Mission Hills Dr", city: "Rancho Mirage", listPrice: 2875000, closingDate: "2022-02-08", closedPrice: 2850000, gci: 71250, nci: 59906.25, status: "Closed", year: 2022 },
    { id: 'T2022-003', propertyType: "Residential", clientType: "Buyer", source: "Sphere", address: "126 Saint Thomas Pl", city: "Rancho Mirage", listPrice: 1925000, closingDate: "2022-03-12", closedPrice: 1900000, gci: 47500, nci: 39937.5, status: "Closed", year: 2022 },
    { id: 'T2022-004', propertyType: "Residential", clientType: "Seller", source: "Referral", address: "73850 Desert Bloom", city: "Palm Desert", listPrice: 1475000, closingDate: "2022-04-20", closedPrice: 1450000, gci: 36250, nci: 30470.31, status: "Closed", year: 2022 },
    { id: 'T2022-005', propertyType: "Residential", clientType: "Buyer", source: "Expired", address: "39 Via Verde", city: "Rancho Mirage", listPrice: 2425000, closingDate: "2022-05-15", closedPrice: 2400000, gci: 60000, nci: 50456.25, status: "Closed", year: 2022 },
    { id: 'T2022-006', propertyType: "Residential", clientType: "Seller", source: "Boomtown", address: "78 Calle Encinitas", city: "La Quinta", listPrice: 1775000, closingDate: "2022-06-18", closedPrice: 1750000, gci: 43750, nci: 36778.13, status: "Closed", year: 2022 },
    { id: 'T2022-007', propertyType: "Residential", clientType: "Buyer", source: "Open House", address: "2 Villaggio Pl", city: "Rancho Mirage", listPrice: 3125000, closingDate: "2022-07-22", closedPrice: 3100000, gci: 77500, nci: 65181.25, status: "Closed", year: 2022 },
    { id: 'T2022-008', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "74950 Jasmine Way", city: "Indian Wells", listPrice: 2650000, closingDate: "2022-08-15", closedPrice: 2625000, gci: 65625, nci: 55193.75, status: "Closed", year: 2022 },
    { id: 'T2022-009', propertyType: "Residential", clientType: "Buyer", source: "Sphere", address: "134 Kavenish Dr", city: "Rancho Mirage", listPrice: 1875000, closingDate: "2022-09-20", closedPrice: 1850000, gci: 46250, nci: 38880.31, status: "Closed", year: 2022 },
    { id: 'T2022-010', propertyType: "Residential", clientType: "Seller", source: "Zillow", address: "49800 Canyon View", city: "Palm Desert", listPrice: 1525000, closingDate: "2022-10-28", closedPrice: 1500000, gci: 37500, nci: 31537.5, status: "Closed", year: 2022 },
    { id: 'T2022-011', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "38 Cresta Verde", city: "Rancho Mirage", listPrice: 2275000, closingDate: "2022-11-18", closedPrice: 2250000, gci: 56250, nci: 47296.88, status: "Closed", year: 2022 },
    { id: 'T2022-012', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "76850 California Dr", city: "Palm Desert", listPrice: 1695000, closingDate: "2022-12-20", closedPrice: 1675000, gci: 41875, nci: 35203.13, status: "Closed", year: 2022 },
    
    // 2023 (9 transactions)
    { id: 'T2023-001', propertyType: "Residential", clientType: "Seller", source: "Expired", address: "78960 Mimosa Dr", city: "Palm Desert", listPrice: 490000, closingDate: "2023-03-21", closedPrice: 490000, gci: 12250, nci: 10054.5, status: "Closed", year: 2023 },
    { id: 'T2023-002', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "2 Normandy", city: "Rancho Mirage", listPrice: 1250000, closingDate: "2023-04-05", closedPrice: 1225000, gci: 30625, nci: 25759.38, status: "Closed", year: 2023 },
    { id: 'T2023-003', propertyType: "Residential", clientType: "Seller", source: "Sphere", address: "76790 Oklahoma Ave", city: "Indian Wells", listPrice: 825000, closingDate: "2023-04-28", closedPrice: 810000, gci: 20250, nci: 17035.31, status: "Closed", year: 2023 },
    { id: 'T2023-004', propertyType: "Residential", clientType: "Buyer", source: "Boomtown", address: "78650 Starlight Ln", city: "La Quinta", listPrice: 749000, closingDate: "2023-05-26", closedPrice: 740000, gci: 18500, nci: 15537.5, status: "Closed", year: 2023 },
    { id: 'T2023-005', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "45 Kavenish Dr", city: "Rancho Mirage", listPrice: 950000, closingDate: "2023-06-15", closedPrice: 925000, gci: 23125, nci: 19450.25, status: "Closed", year: 2023 },
    { id: 'T2023-006', propertyType: "Residential", clientType: "Buyer", source: "Zillow", address: "122 Via Santo Tomas", city: "Rancho Mirage", listPrice: 1100000, closingDate: "2023-07-22", closedPrice: 1075000, gci: 26875, nci: 22589.75, status: "Closed", year: 2023 },
    { id: 'T2023-007', propertyType: "Residential", clientType: "Seller", source: "Open House", address: "73450 Country Club Dr", city: "Palm Desert", listPrice: 875000, closingDate: "2023-08-30", closedPrice: 850000, gci: 21250, nci: 17856.25, status: "Closed", year: 2023 },
    { id: 'T2023-008', propertyType: "Residential", clientType: "Buyer", source: "Referral", address: "50 Dartmouth Dr", city: "Rancho Mirage", listPrice: 1250000, closingDate: "2023-09-18", closedPrice: 1225000, gci: 30625, nci: 25746.25, status: "Closed", year: 2023 },
    { id: 'T2023-009', propertyType: "Residential", clientType: "Seller", source: "Past Client", address: "77564 Preston Trl", city: "Palm Desert", listPrice: 685000, closingDate: "2023-10-12", closedPrice: 675000, gci: 16875, nci: 14178.75, status: "Closed", year: 2023 },
    
    // 2024 (1 transaction)
    { id: 'T2024-001', propertyType: "Residential", clientType: "Seller", source: "Outside Referral", address: "75980 Nelson Lane", city: "Palm Desert", listPrice: 990000, commissionPct: 0.0241, closingDate: "2024-09-30", closedPrice: 990000, gci: 23883.75, referralPct: 0.31, referralDollar: 7425, adjustedGci: 16458.75, nci: 13825.06, status: "Closed", year: 2024 },
    
    // 2025 (3 transactions)
    { id: 'T2025-001', propertyType: "Residential", clientType: "Seller", source: "Coastal Capital Homes", address: "2490 E Francis Drive", city: "Palm Springs", listPrice: 575000, commissionPct: 0.0048, closingDate: "2025-04-11", closedPrice: 575000, gci: 2750, nci: 1610, status: "Closed", year: 2025 },
    { id: 'T2025-002', propertyType: "Residential", clientType: "Seller", source: "Jelmberg Team", address: "2 Cassis Circle", city: "Rancho Mirage", listPrice: 1355000, commissionPct: 0.025, closingDate: "2025-06-20", closedPrice: 1355000, gci: 33875, nci: 28973.19, status: "Closed", year: 2025 },
    { id: 'T2025-003', propertyType: "Residential", clientType: "Referral", source: "David Bellings", address: "2440 Clay Street", city: "San Francisco", listPrice: 16237, commissionPct: 0.25, closingDate: "2025-08-26", closedPrice: 16237, gci: 16237.5, nci: 13639.5, status: "Closed", year: 2025 },
  ];

  // State management
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedTransaction, setEditedTransaction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedClientType, setSelectedClientType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [useLocalStorage, setUseLocalStorage] = useState(true);
  const [formData, setFormData] = useState({
    propertyType: 'Residential',
    clientType: 'Seller',
    source: '',
    address: '',
    city: '',
    listPrice: '',
    closedPrice: '',
    closingDate: '',
    gci: '',
    nci: '',
    status: 'Closed'
  });
  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      if (useLocalStorage) {
        const saved = localStorage.getItem('realEstateTransactions');
        if (saved) {
          setTransactions(JSON.parse(saved));
        } else {
          setTransactions(completeTransactionData);
          localStorage.setItem('realEstateTransactions', JSON.stringify(completeTransactionData));
        }
      } else {
        await syncFromGoogleSheets();
      }
    };
    initializeData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToLocalStorage = (data) => {
    localStorage.setItem('realEstateTransactions', JSON.stringify(data));
  };

  const syncFromGoogleSheets = async () => {
    setSyncStatus('syncing');
    try {
      const result = await fetch(APPS_SCRIPT_URL).then(res => res.json());
      
      if (!result.success) {
        alert(`Sync Error: ${result.error}`);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return;
      }
      
      if (!result.data || result.data.length === 0) {
        alert('✓ Sync successful, but your Google Sheet is empty!\n\nTo add data:\n1. Click "Export" button\n2. Import the CSV into your Google Sheet\n3. Then sync again');
        setTransactions(completeTransactionData);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return;
      }
      
      setTransactions(result.data);
      setSyncStatus('success');
      alert(`✓ Successfully synced ${result.data.length} transactions from Google Sheets!`);
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Error syncing from Google Sheets:', error);
      alert(`Sync failed: ${error.message}\n\nMake sure:\n1. Apps Script is deployed\n2. Webhook URL is correct\n3. Internet connection is working`);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const syncToGoogleSheets = async (action, data) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          ...data
        }),
        mode: 'no-cors' // Required for Google Apps Script
      });
      
      // Note: no-cors mode means we can't read the response, but the request goes through
      return { success: true };
    } catch (error) {
      console.error('Error writing to Google Sheets:', error);
      return { success: false, error: error.message };
    }
  };

  const exportToCSV = () => {
    const headers = ['propertyType', 'clientType', 'source', 'address', 'city', 'listPrice', 'commissionPct', 'closingDate', 'closedPrice', 'gci', 'referralPct', 'referralDollar', 'adjustedGci', 'nci', 'status', 'year', 'transactionId', 'deductions'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => headers.map(h => {
        const value = t[h] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditedTransaction({ ...transaction });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

  const saveEdit = async () => {
    const updatedTransactions = transactions.map(t => 
      t.id === editingId ? editedTransaction : t
    );
    setTransactions(updatedTransactions);
    
    if (useLocalStorage) {
      saveToLocalStorage(updatedTransactions);
    } else {
      // Sync to Google Sheets
      await syncToGoogleSheets('update', { transaction: editedTransaction });
    }
    
    setEditingId(null);
    setEditedTransaction(null);
  };

  const updateField = (field, value) => {
    setEditedTransaction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const deleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      
      if (useLocalStorage) {
        saveToLocalStorage(updatedTransactions);
      } else {
        // Sync deletion to Google Sheets
        await syncToGoogleSheets('delete', { transactionId: id });
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const transaction = {
      ...formData,
      id: `T${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      year: new Date(formData.closingDate).getFullYear(),
      listPrice: parseFloat(formData.listPrice) || 0,
      closedPrice: parseFloat(formData.closedPrice) || 0,
      gci: parseFloat(formData.gci) || 0,
      nci: parseFloat(formData.nci) || 0,
    };
    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    
    if (useLocalStorage) {
      saveToLocalStorage(updatedTransactions);
    } else {
      // Sync to Google Sheets
      await syncToGoogleSheets('add', { transaction: transaction });
    }
    
    setShowForm(false);
    setFormData({
      propertyType: 'Residential',
      clientType: 'Seller',
      source: '',
      address: '',
      city: '',
      listPrice: '',
      closedPrice: '',
      closingDate: '',
      gci: '',
      nci: '',
      status: 'Closed'
    });
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  // Apply all filters (used for both metrics and table)
  let filteredData = transactions;
  
  if (selectedYear !== 'all') {
    filteredData = filteredData.filter(t => t.year === parseInt(selectedYear));
  }
  
  if (selectedCity !== 'all') {
    filteredData = filteredData.filter(t => t.city === selectedCity);
  }
  
  if (selectedClientType !== 'all') {
    filteredData = filteredData.filter(t => t.clientType === selectedClientType);
  }
  
  if (selectedSource !== 'all') {
    filteredData = filteredData.filter(t => t.source === selectedSource);
  }

  // Table uses the same filtered data
  const tableFilteredData = filteredData;

  // Calculate metrics
  const totalGCI = filteredData.reduce((sum, t) => sum + (t.gci || 0), 0);
  const totalNCI = filteredData.reduce((sum, t) => sum + (t.nci || 0), 0);
  const totalSalesVolume = filteredData.reduce((sum, t) => sum + (t.closedPrice || 0), 0);
  const avgCommission = filteredData.length > 0 ? totalGCI / filteredData.length : 0;
  const avgNetCommission = filteredData.length > 0 ? totalNCI / filteredData.length : 0;

  // Get unique values for filters
  const years = [...new Set(transactions.map(t => t.year))].sort();
  const cities = [...new Set(transactions.map(t => t.city))].sort();
  const sources = [...new Set(transactions.map(t => t.source))].filter(s => s).sort();
  
  const yearData = years.map(year => {
    const yearTransactions = transactions.filter(t => t.year === year);
    return {
      year,
      income: yearTransactions.reduce((sum, t) => sum + (t.nci || 0), 0),
      deals: yearTransactions.length
    };
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-6">
        {/* Logo */}
<div className="w-32 h-32 flex-shrink-0 bg-white rounded-lg p-2 shadow-lg">
  <img 
    src="/janice-logo.png"
    alt="Janice Glaab Real Estate" 
    className="w-full h-full object-contain"
  />
</div>
            
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Real Estate Performance Dashboard</h1>
              <p className="text-purple-200">Janice Glaab - With Cloud Sync & Editing</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            {/* Sync Mode Toggle */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!useLocalStorage}
                  onChange={(e) => setUseLocalStorage(!e.target.checked)}
                  className="rounded"
                />
                Google Sheets Sync
              </label>
            </div>

            {/* Sync Button */}
            {!useLocalStorage && (
              <button
                onClick={syncFromGoogleSheets}
                disabled={syncStatus === 'syncing'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Add Transaction Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm ? 'Close' : 'Add Transaction'}
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus !== 'idle' && (
          <div className={`mb-4 p-4 rounded-lg ${
            syncStatus === 'syncing' ? 'bg-blue-500/20 border border-blue-500' :
            syncStatus === 'success' ? 'bg-green-500/20 border border-green-500' :
            'bg-red-500/20 border border-red-500'
          }`}>
            <p className="text-white">
              {syncStatus === 'syncing' && '⏳ Syncing with Google Sheets...'}
              {syncStatus === 'success' && '✓ Successfully synced!'}
              {syncStatus === 'error' && '✗ Sync failed. Check your configuration.'}
            </p>
          </div>
        )}

        {/* Add Transaction Form */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Property Type</label>
                <select name="propertyType" value={formData.propertyType} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Client Type</label>
                <select name="clientType" value={formData.clientType} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white">
                  <option value="Seller">Seller</option>
                  <option value="Buyer">Buyer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Source</label>
                <input type="text" name="source" value={formData.source} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="Lead source" />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="Street address" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="City" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">List Price ($)</label>
                <input type="number" step="0.01" name="listPrice" value={formData.listPrice} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Closed Price ($)</label>
                <input type="number" step="0.01" name="closedPrice" value={formData.closedPrice} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Closing Date</label>
                <input type="date" name="closingDate" value={formData.closingDate} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Gross Commission Income ($)</label>
                <input type="number" step="0.01" name="gci" value={formData.gci} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Net Commission Income ($)</label>
                <input type="number" step="0.01" name="nci" value={formData.nci} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400" placeholder="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white">
                  <option value="Closed">Closed</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-xl transition">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-purple-800/50 border border-purple-600/30 rounded-lg text-white"
              >
                <option value="all">All</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 bg-purple-800/50 border border-purple-600/30 rounded-lg text-white"
              >
                <option value="all">All</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">Client Type</label>
              <select
                value={selectedClientType}
                onChange={(e) => setSelectedClientType(e.target.value)}
                className="w-full px-4 py-3 bg-purple-800/50 border border-purple-600/30 rounded-lg text-white"
              >
                <option value="all">All</option>
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-white mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-3 bg-purple-800/50 border border-purple-600/30 rounded-lg text-white"
              >
                <option value="all">All</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Cards - 3 per row, compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Total Transactions</h3>
            <p className="text-3xl font-bold text-white">{filteredData.length}</p>
          </div>
          
          <div className="bg-purple-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Total Net Commission Income</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalNCI)}</p>
          </div>
          
          <div className="bg-pink-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Total Gross Commission Income</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalGCI)}</p>
          </div>
          
          <div className="bg-orange-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Total Sales Volume</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalSalesVolume)}</p>
          </div>
          
          <div className="bg-emerald-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Avg Commission/Deal</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgCommission)}</p>
          </div>
          
          <div className="bg-cyan-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-white text-xs font-medium mb-1">Avg Net Commission/Deal</h3>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgNetCommission)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Income by Year</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="#fff" />
                <YAxis stroke="#fff" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="income" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Deals by Year</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="deals" stroke="#ec4899" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Table with Edit/Delete */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">
            All Transactions ({tableFilteredData.length})
          </h3>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-white text-sm">
              <thead className="border-b border-white/20 sticky top-0 bg-slate-900/95">
                <tr>
                  <th className="pb-3 pr-4 pt-2">Date</th>
                  <th className="pb-3 pr-4 pt-2">Address</th>
                  <th className="pb-3 pr-4 pt-2">City</th>
                  <th className="pb-3 pr-4 pt-2">Type</th>
                  <th className="pb-3 pr-4 pt-2">Closed Price</th>
                  <th className="pb-3 pr-4 pt-2">Gross Commission</th>
                  <th className="pb-3 pr-4 pt-2">Net Commission</th>
                  <th className="pb-3 pr-4 pt-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableFilteredData.map((t) => (
                  <tr key={t.id} className={`border-b border-white/10 hover:bg-white/5 ${editingId === t.id ? 'bg-blue-500/20' : ''}`}>
                    {editingId === t.id ? (
                      <>
                        <td className="py-3 pr-4">
                          <input
                            type="date"
                            value={editedTransaction.closingDate}
                            onChange={(e) => updateField('closingDate', e.target.value)}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-full text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={editedTransaction.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-full text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={editedTransaction.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-full text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={editedTransaction.clientType}
                            onChange={(e) => updateField('clientType', e.target.value)}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-full text-white text-sm"
                          >
                            <option>Buyer</option>
                            <option>Seller</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            value={editedTransaction.closedPrice}
                            onChange={(e) => updateField('closedPrice', parseFloat(e.target.value))}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-24 text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            value={editedTransaction.gci}
                            onChange={(e) => updateField('gci', parseFloat(e.target.value))}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-24 text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            value={editedTransaction.nci}
                            onChange={(e) => updateField('nci', parseFloat(e.target.value))}
                            className="bg-white/10 border border-white/30 rounded px-2 py-1 w-24 text-white text-sm"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={saveEdit}
                              className="p-2 bg-green-500 rounded hover:bg-green-600"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 bg-gray-500 rounded hover:bg-gray-600"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-4">{t.closingDate}</td>
                        <td className="py-3 pr-4">{t.address}</td>
                        <td className="py-3 pr-4">{t.city}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-1 rounded text-xs bg-purple-500/30">
                            {t.clientType}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{formatCurrency(t.closedPrice)}</td>
                        <td className="py-3 pr-4 text-blue-300">{formatCurrency(t.gci)}</td>
                        <td className="py-3 pr-4 font-bold text-emerald-300">{formatCurrency(t.nci)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => startEdit(t)}
                              className="p-2 bg-blue-500 rounded hover:bg-blue-600"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              className="p-2 bg-red-500 rounded hover:bg-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateDashboard;
