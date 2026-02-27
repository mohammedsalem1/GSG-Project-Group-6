import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  CreatePolicySectionDto,
  UpdatePolicySectionDto,
  PolicySectionResponseDto,
  PolicyTypeGroupDto,
  PolicyListResponseDto,
} from '../dto/admin-policies.dto';
import { PolicyType } from '@prisma/client';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new policy section
   */
  async createPolicySection(
    dto: CreatePolicySectionDto,
  ): Promise<PolicySectionResponseDto> {
    // Check for duplicate section title within same policy type
    const existing = await this.prisma.policySection.findFirst({
      where: {
        policyType: dto.policyType,
        sectionTitle: dto.sectionTitle,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Section title already exists for this policy type',
      );
    }

    const section = await this.prisma.policySection.create({
      data: {
        policyType: dto.policyType,
        sectionTitle: dto.sectionTitle,
        sectionContent: dto.sectionContent,
        sectionOrder: dto.sectionOrder ?? 0,
        version: 1,
      },
    });

    return this.mapToDto(section);
  }

  /**
   * Update policy section
   */
  async updatePolicySection(
    id: string,
    dto: UpdatePolicySectionDto,
  ): Promise<PolicySectionResponseDto> {
    const section = await this.prisma.policySection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException('Policy section not found');
    }

    // Check for duplicate title if updating title
    if (dto.sectionTitle && dto.sectionTitle !== section.sectionTitle) {
      const existing = await this.prisma.policySection.findFirst({
        where: {
          policyType: section.policyType,
          sectionTitle: dto.sectionTitle,
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Section title already exists for this policy type',
        );
      }
    }

    const updated = await this.prisma.policySection.update({
      where: { id },
      data: {
        sectionTitle: dto.sectionTitle,
        sectionContent: dto.sectionContent,
        sectionOrder: dto.sectionOrder,
        version: section.version + 1, // Increment version on update
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Delete policy section
   */
  async deletePolicySection(id: string): Promise<{ message: string }> {
    const section = await this.prisma.policySection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException('Policy section not found');
    }

    await this.prisma.policySection.delete({
      where: { id },
    });

    return { message: 'Policy section deleted successfully' };
  }

  /**
   * Get all policies grouped by type
   */
  async listPolicies(): Promise<PolicyListResponseDto> {
    const sections = await this.prisma.policySection.findMany({
      orderBy: [{ policyType: 'asc' }, { sectionOrder: 'asc' }],
    });

    // Group by policy type
    const grouped: Record<PolicyType, PolicySectionResponseDto[]> = {
      [PolicyType.TERMS_OF_SERVICE]: [],
      [PolicyType.PRIVACY_POLICY]: [],
      [PolicyType.COMMUNITY_GUIDELINES]: [],
    };

    sections.forEach((section) => {
      grouped[section.policyType].push(this.mapToDto(section));
    });

    const data: PolicyTypeGroupDto[] = Object.entries(grouped).map(
      ([type, sectionsList]) => ({
        policyType: type as PolicyType,
        sections: sectionsList,
      }),
    );

    return {
      data,
      total: sections.length,
    };
  }

  /**
   * Get all sections of a specific policy type
   */
  async getPoliciesByType(type: PolicyType): Promise<{
    policyType: PolicyType;
    sections: PolicySectionResponseDto[];
  }> {
    const sections = await this.prisma.policySection.findMany({
      where: { policyType: type },
      orderBy: { sectionOrder: 'asc' },
    });

    return {
      policyType: type,
      sections: sections.map((s) => this.mapToDto(s)),
    };
  }

  /**
   * Get public policies (for display to users)
   * Returns all policies in a readable format
   */
  async getPublicPolicies(): Promise<{
    termsOfService: PolicySectionResponseDto[];
    privacyPolicy: PolicySectionResponseDto[];
    communityGuidelines: PolicySectionResponseDto[];
  }> {
    const [tos, privacy, guidelines] = await Promise.all([
      this.prisma.policySection.findMany({
        where: { policyType: PolicyType.TERMS_OF_SERVICE },
        orderBy: { sectionOrder: 'asc' },
      }),
      this.prisma.policySection.findMany({
        where: { policyType: PolicyType.PRIVACY_POLICY },
        orderBy: { sectionOrder: 'asc' },
      }),
      this.prisma.policySection.findMany({
        where: { policyType: PolicyType.COMMUNITY_GUIDELINES },
        orderBy: { sectionOrder: 'asc' },
      }),
    ]);

    return {
      termsOfService: tos.map((s) => this.mapToDto(s)),
      privacyPolicy: privacy.map((s) => this.mapToDto(s)),
      communityGuidelines: guidelines.map((s) => this.mapToDto(s)),
    };
  }

  private mapToDto(section: any): PolicySectionResponseDto {
    return {
      id: section.id,
      policyType: section.policyType,
      sectionTitle: section.sectionTitle,
      sectionContent: section.sectionContent,
      sectionOrder: section.sectionOrder,
      version: section.version,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}
