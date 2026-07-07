import { describe, it, expect } from 'vitest';
import { Registry } from '../pipeline-registry';

describe('PipelineRegistry', () => {
  const mockPipelines = [
    {
      id: 'p-lead',
      name: 'Lead Nurture Pipeline',
      stages: [
        { id: 's1', name: 'New Lead' },
        { id: 's2', name: 'Contacted' },
      ]
    },
    {
      id: 'p-buyer',
      name: 'Buyer Transaction',
      stages: [
        { id: 'b1', name: 'Searching' },
        { id: 'b2', name: 'Under Contract' },
        { id: 'b3', name: 'Closed' },
      ]
    },
    {
      id: 'p-seller',
      name: 'Seller Pipeline',
      stages: [
        { id: 's1', name: 'Listing' },
        { id: 's2', name: 'Pending' },
      ]
    }
  ];

  it('resolves pipelines by name correctly', () => {
    const registry = new Registry();
    registry.setPipelines(mockPipelines as any);
    
    expect(registry.byName('lead')?.id).toBe('p-lead');
    expect(registry.byName('buyer')?.id).toBe('p-buyer');
    expect(registry.byName('seller')?.id).toBe('p-seller');
  });

  it('finds underContractPosition correctly', () => {
    const registry = new Registry();
    registry.setPipelines(mockPipelines as any);
    expect(registry.underContractPosition('p-buyer')).toBe(1); // 0-indexed, 'Under Contract' is at index 1
  });
});
