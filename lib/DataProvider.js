'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthProvider';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const channelsRef = useRef([]);

  const loadAll = useCallback(async () => {
    const [c, s, p, m, u] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('sites').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      supabase.from('stock_movements').select('*, products(name, ref, unit), sites(name), profiles(first_name,last_name)').order('created_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('*').order('first_name')
    ]);
    setCategories(c.data || []);
    setSites(s.data || []);
    setProducts(p.data || []);
    setMovements(m.data || []);
    setUsers(u.data || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (!session) { setLoadingData(true); return; }
    loadAll();

    const productsCh = supabase
      .channel('products-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((p) => p.id !== payload.old.id);
          const exists = prev.some((p) => p.id === payload.new.id);
          return exists ? prev.map((p) => (p.id === payload.new.id ? payload.new : p)) : [...prev, payload.new];
        });
      })
      .subscribe();

    const movementsCh = supabase
      .channel('movements-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, async () => {
        // refetch the most recent slice with its joined names — simplest reliable approach
        const { data } = await supabase.from('stock_movements').select('*, products(name, ref, unit), sites(name), profiles(first_name,last_name)').order('created_at', { ascending: false }).limit(500);
        if (data) setMovements(data);
      })
      .subscribe();

    const categoriesCh = supabase
      .channel('categories-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('name').then(({ data }) => data && setCategories(data));
      })
      .subscribe();

    const sitesCh = supabase
      .channel('sites-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sites' }, () => {
        supabase.from('sites').select('*').order('name').then(({ data }) => data && setSites(data));
      })
      .subscribe();

    channelsRef.current = [productsCh, movementsCh, categoriesCh, sitesCh];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loadAll]);

  return (
    <DataContext.Provider value={{ categories, sites, products, movements, users, loadingData, refreshAll: loadAll, refreshUsers: async () => { const { data } = await supabase.from('profiles').select('*').order('first_name'); if (data) setUsers(data); } }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
