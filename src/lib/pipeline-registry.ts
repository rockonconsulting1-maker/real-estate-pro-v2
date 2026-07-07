import { Pipeline, Stage } from '@/types/ghl';

export interface EnrichedStage extends Stage {
  position: number;
  color: string;
}

export interface ResolvedPipeline {
  id: string;
  name: string;
  pipelineId: string;
  stages: EnrichedStage[];
}

const STAGE_COLORS = [
  'var(--stage-1)',
  'var(--stage-2)',
  'var(--stage-3)',
  'var(--stage-4)',
  'var(--stage-5)',
  'var(--stage-6)',
];

export class Registry {
  private pipelines: Pipeline[] = [];
  
  setPipelines(pipelines: Pipeline[]) {
    this.pipelines = pipelines;
  }

  byName(type: 'lead' | 'buyer' | 'seller'): ResolvedPipeline | null {
    const matchers = {
      lead: ['lead nurture', 'lead', 'leads'],
      buyer: ['buyer transaction', 'buyer', 'buyers'],
      seller: ['seller', 'sellers', 'seller pipeline'],
    };

    const target = matchers[type];
    const found = this.pipelines.find(p => 
      target.some(t => p.name.toLowerCase().includes(t))
    );

    if (!found) return null;

    const stages = (found.stages || []).map((s, idx) => ({
      ...s,
      position: idx,
      color: STAGE_COLORS[idx % STAGE_COLORS.length],
    }));

    return {
      id: found.id,
      name: found.name,
      pipelineId: found.id,
      stages,
    };
  }

  getPipeline(pipelineId: string): ResolvedPipeline | null {
    const found = this.pipelines.find(p => p.id === pipelineId);
    if (!found) return null;
    const stages = (found.stages || []).map((s, idx) => ({
      ...s,
      position: idx,
      color: STAGE_COLORS[idx % STAGE_COLORS.length],
    }));
    return { id: found.id, name: found.name, pipelineId: found.id, stages };
  }

  getStage(stageId: string): EnrichedStage | null {
    for (const p of this.pipelines) {
      const idx = p.stages?.findIndex(s => s.id === stageId);
      if (idx !== undefined && idx !== -1) {
        return {
          ...p.stages![idx],
          position: idx,
          color: STAGE_COLORS[idx % STAGE_COLORS.length],
        };
      }
    }
    return null;
  }

  stageLabel(stageId: string): string {
    for (const p of this.pipelines) {
      const stage = p.stages?.find(s => s.id === stageId);
      if (stage) return stage.name;
    }
    return 'Unknown Stage';
  }

  stagePosition(stageId: string): number {
    for (const p of this.pipelines) {
      const idx = p.stages?.findIndex(s => s.id === stageId);
      if (idx !== undefined && idx !== -1) return idx;
    }
    return -1;
  }

  underContractPosition(pipelineId: string): number {
    const p = this.pipelines.find(p => p.id === pipelineId);
    if (!p || !p.stages) return -1;
    const idx = p.stages.findIndex(s => /under contract|conditional|firm|pending|clos/i.test(s.name));
    if (idx !== -1) return idx;
    return Math.max(0, p.stages.length - 3);
  }
}

export const PipelineRegistry = new Registry();
