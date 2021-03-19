import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);

      if (findProduct) {
        updateProductAmount({ productId, amount: findProduct.amount + 1 });
      } else {
        const verifyStock = await api.get<Stock>(`stock/${productId}`)

        if (verifyStock.data.amount > 0) {
         const response = await api.get(`/products/${productId}`)

          const updatedCart = [...cart, { ...response.data, amount: 1 }]

          setCart(updatedCart)

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredProductFromCart = cart.filter((product) => product.id !== productId);

      if (filteredProductFromCart.length === cart.length) {
        return toast.error('Erro na remoção do produto');
      }

      setCart(filteredProductFromCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProductFromCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const response = await api.get<Stock>(`stock/${productId}`)

      if (amount > response.data.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      const updatedCart = cart.map((product) => 
        (product.id === productId 
          ? { ...product, amount } 
          : product 
      ))

      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
