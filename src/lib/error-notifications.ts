import type {
    MutationCache,
    QueryCache,
    QueryClient
} from "@tanstack/react-query"

type Handlers = {
    query: NonNullable<QueryCache["config"]["onError"]>
    mutation: NonNullable<MutationCache["config"]["onError"]>
    priority: number
}
type Registration = { handlers: Set<Handlers>; restore: () => void }
const registrations = new WeakMap<QueryClient, Registration>()

/** One notification per cache error, including when standalone and BTST providers nest. */
export function registerErrorNotifications(
    client: QueryClient,
    handlers: Handlers
) {
    let registration = registrations.get(client)
    if (!registration) {
        const listeners = new Set<Handlers>()
        const current = () =>
            [...listeners].sort((a, b) => b.priority - a.priority)[0]
        const queryCache = client.getQueryCache()
        const mutationCache = client.getMutationCache()
        const previousQuery = queryCache.config.onError
        const previousMutation = mutationCache.config.onError
        const query: Handlers["query"] = (...args) => {
            previousQuery?.(...args)
            current()?.query(...args)
        }
        const mutation: Handlers["mutation"] = (...args) => {
            previousMutation?.(...args)
            current()?.mutation(...args)
        }
        queryCache.config.onError = query
        mutationCache.config.onError = mutation
        registration = {
            handlers: listeners,
            restore: () => {
                if (queryCache.config.onError === query)
                    queryCache.config.onError = previousQuery
                if (mutationCache.config.onError === mutation)
                    mutationCache.config.onError = previousMutation
            }
        }
        registrations.set(client, registration)
    }
    registration.handlers.add(handlers)
    return () => {
        registration.handlers.delete(handlers)
        if (!registration.handlers.size) {
            registration.restore()
            registrations.delete(client)
        }
    }
}
