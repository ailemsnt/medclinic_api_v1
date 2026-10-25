import { SetMetadata } from '@nestjs/common'

export const PUBLIC_ROUTE_METADATA_KEY = 'PUBLIC_ROUTE_METADATA_KEY'

export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_METADATA_KEY, true)
