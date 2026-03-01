import { createBrowserRouter } from 'react-router';
import { LayoutPage } from '@/presentation/pages/LayoutWithNavigation';
import { HomePage } from '@/presentation/pages/HomePage';
import { AddProduct } from '@/presentation/pages/AddProduct';
import { ProductDetail } from '@/presentation/pages/ProductDetail';
import { HistoryPage } from '@/presentation/pages/HistoryPage';
import { ArchivePage } from '@/presentation/pages/ArchivePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LayoutPage,
    children: [
      { index: true, Component: HomePage },
      { path: 'add', Component: AddProduct },
      { path: 'item/:id', Component: ProductDetail },
      { path: 'history', Component: HistoryPage },
      { path: 'archive', Component: ArchivePage },
    ],
  },
]);
