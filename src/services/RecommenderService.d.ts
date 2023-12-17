declare module 'ger' {
  export default {
    MemESM: MemESM,
    GER: GER
  }

  export class MemESM {
    constructor()
  }

  export interface GER {
    new (esm: MemESM)
    initialize_namespace(namespace: string): Promise<void>
    events(events: GEREvent[]): Promise<void>
    add_events(events: GEREvent[]): Promise<void>
    delete_events(events: GEREvent[]): Promise<void>
    find_events(events: GEREvent[]): Promise<void>
    add_event(event: GEREvent): Promise<void>
    recommendations_for_thing(namespace: string, thing: string, options: RecommendationOptions): Promise<void>
  }

  export interface GEREvent {
    namespace: string
    person: string
    action: string
    thing: string
    expires_at: string
  }

  export interface RecommendationOptions {
    actions: Record<string, number>
    minimum_history_required?: number
    similarity_search_size?: number
    neighbourhood_size?: number
    recommendations_per_neighbour?: number
    filter_previous_actions?: string[]
    event_decay_rate?: number
    time_until_expiry?: number
  }
}
