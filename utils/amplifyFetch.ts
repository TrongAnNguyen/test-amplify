/**
 * Recursively fetches all pages from a paginated Amplify list API using nextToken cursor.
 */
export async function fetchAllPages<T>(
  fetchPage: (nextToken?: string | null) => Promise<{
    data: T[]
    nextToken?: string | null
    errors?: any[]
  }>,
): Promise<T[]> {
  let nextToken: string | null = null
  const allData: T[] = []

  do {
    const response = await fetchPage(nextToken)
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message)
    }
    if (response.data) {
      allData.push(...response.data)
    }
    nextToken = response.nextToken || null
  } while (nextToken)

  return allData
}
