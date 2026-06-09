import { Controller, Get, Query } from '@nestjs/common';
import { successResponse } from '../../common/responses/api-response';
import { Public } from '../auth/decorators/public.decorator';
import { PublicSelfServiceService } from './public-self-service.service';

@Public()
@Controller('public/directory')
export class PublicDirectoryController {
  constructor(private readonly publicSelfServiceService: PublicSelfServiceService) {}

  @Get('businesses')
  async searchBusinesses(@Query('query') query?: string, @Query('businessType') businessType?: string) {
    return successResponse(await this.publicSelfServiceService.searchPublicBusinesses({ query, businessType }));
  }
}
