import { NextResponse } from 'next/server';

export async function GET() {
  // Dummy data following the OpenAPI 'Dataset' schema
  const datasets = [
    {
      id: 'ds_001',
      name: 'Sample Dataset 1',
      description: 'A test description for Dataset 1',
      size: '1GB',
      records: 1000,
      updatedAt: new Date().toISOString(),
      tags: ['test', 'sample', 'ai']
    },
    {
      id: 'ds_002',
      name: 'Demo Dataset 2',
      description: 'Another test description for Dataset 2',
      size: '500MB',
      records: 300,
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'toy', 'public']
    }
  ];
  return NextResponse.json({ datasets });
}
