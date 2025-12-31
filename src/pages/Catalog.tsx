import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, RefreshCw, Image } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiService, PaginatedProducts, CatalogFilters, Category, Supplier } from '@/lib/api';
import { Product } from '@/lib/types';
import { ProductDetailModal } from '@/components/ProductDetailModal';

export default function Catalog() {
  const [paginatedData, setPaginatedData] = useState<PaginatedProducts>({
    products: [],
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const limit = 50;

  // Load filter options
  useEffect(() => {
    async function loadFilters() {
      const [cats, sups] = await Promise.all([
        apiService.getCategories(),
        apiService.getSuppliers()
      ]);
      setCategories(cats);
      setSuppliers(sups);
    }
    loadFilters();
  }, []);

  const loadProducts = useCallback(async (page: number, search: string, currentFilters: CatalogFilters) => {
    setLoading(true);
    try {
      const data = await apiService.getProducts(page, limit, search, currentFilters);
      setPaginatedData(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(currentPage, searchQuery, filters);
  }, [currentPage, filters, loadProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadProducts(1, searchQuery, filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, loadProducts, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginatedData.totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    loadProducts(currentPage, searchQuery, filters);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const { totalPages, page } = paginatedData;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (page > 3) {
        pages.push('...');
      }
      
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <MainLayout>
      <PageHeader
        title="Catálogo de Produtos"
        description="Gerencie seu inventário de produtos"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="default" className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Package className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </PageHeader>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border/50 focus:border-primary"
          />
        </div>
        
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 h-11 relative">
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Filtros</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoria</label>
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fornecedor</label>
                  <Select 
                    value={filters.supplier || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, supplier: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      {suppliers.map(sup => (
                        <SelectItem key={sup.id} value={String(sup.id)}>{sup.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                  <Select 
                    value={filters.status || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                      <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => setFiltersOpen(false)}
              >
                Aplicar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.category && filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Categoria: {categories.find(c => String(c.id) === filters.category)?.name}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, category: undefined }))}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.supplier && filters.supplier !== 'all' && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Fornecedor: {suppliers.find(s => String(s.id) === filters.supplier)?.name}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, supplier: undefined }))}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Status: {filters.status === 'active' ? 'Ativo' : filters.status === 'low_stock' ? 'Estoque Baixo' : filters.status === 'out_of_stock' ? 'Sem Estoque' : 'Inativo'}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {paginatedData.total > 0 ? (
            <>
              Mostrando{' '}
              <span className="font-semibold text-foreground">
                {((currentPage - 1) * limit) + 1}
              </span>
              {' '}-{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * limit, paginatedData.total)}
              </span>
              {' '}de{' '}
              <span className="font-semibold text-foreground">
                {paginatedData.total.toLocaleString('pt-BR')}
              </span>
              {' '}produtos
            </>
          ) : (
            'Nenhum produto encontrado'
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.products.map((product) => (
                    <tr 
                      key={product.id} 
                      className="table-row-hover group cursor-pointer hover:bg-primary/5"
                      onClick={() => {
                        setSelectedProduct(product);
                        setModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Image className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {product.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            product.stock === 0 
                              ? 'text-destructive' 
                              : product.stock <= 80 
                              ? 'text-warning' 
                              : 'text-success'
                          }`}>
                            {product.stock}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {product.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {product.supplier}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={product.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedData.products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tente buscar com outros termos ou ajuste os filtros
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {paginatedData.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Página <span className="font-semibold text-foreground">{currentPage}</span> de <span className="font-semibold text-foreground">{paginatedData.totalPages}</span>
              </p>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {renderPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => goToPage(page as number)}
                        className={`h-9 w-9 ${currentPage === page ? 'bg-primary shadow-lg shadow-primary/25' : ''}`}
                      >
                        {page}
                      </Button>
                    )
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === paginatedData.totalPages}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(paginatedData.totalPages)}
                  disabled={currentPage === paginatedData.totalPages}
                  className="h-9 w-9"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </MainLayout>
  );
}