-- Migration: add shipping columns to app_orders
-- Adds shipping_method, shipping_cost, packeta_address for checkout data

alter table if exists public.app_orders
  add column if not exists shipping_method text null;

alter table if exists public.app_orders
  add column if not exists shipping_cost numeric null default 0;

alter table if exists public.app_orders
  add column if not exists packeta_address text null;
