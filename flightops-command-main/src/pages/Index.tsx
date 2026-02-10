import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
