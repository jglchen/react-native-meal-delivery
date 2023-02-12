import React, { createContext } from 'react';
import {MealOrderType} from '../lib/types';

export const UserContext = createContext({
    isLoggedIn: false,
    user: {},
    login: () => { },
    logout: () => { }
});

export const OrdersContext = createContext({
    orderlist: [] as MealOrderType[],
    update: () => { },
});

