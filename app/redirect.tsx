'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到新的 dashboard 布局
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-text-secondary">正在跳转...</p>
      </div>
    </div>
  );
}