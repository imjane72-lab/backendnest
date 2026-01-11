// social/kakao.service.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface KakaoTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  kakao_account: {
    profile_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
  };
}

@Injectable()
export class KakaoService {
  private readonly logger = new Logger(KakaoService.name);
  private readonly kakaoAuthUrl = 'https://kauth.kakao.com';
  private readonly kakaoApiUrl = 'https://kapi.kakao.com';

  constructor(private configService: ConfigService) {}

  /**
   * 카카오 로그인 URL 생성
   */
  getKakaoLoginUrl(): string {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new HttpException(
        '카카오 로그인 설정이 올바르지 않습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
    });

    return `${this.kakaoAuthUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * 인가 코드로 액세스 토큰 발급
   */
  async getKakaoToken(code: string): Promise<KakaoTokenResponse> {
    try {
      const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
      const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        throw new HttpException(
          '카카오 로그인 설정이 올바르지 않습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      });

      const clientSecret = this.configService.get<string>(
        'KAKAO_CLIENT_SECRET',
      );
      if (clientSecret) {
        params.append('client_secret', clientSecret);
      }

      const response = await axios.post<KakaoTokenResponse>(
        `${this.kakaoAuthUrl}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      // ✅ 응답 검증 추가
      if (!response.data.access_token) {
        throw new HttpException(
          '카카오 토큰 발급에 실패했습니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('카카오 토큰 발급 실패', error);
      this.handleKakaoError(error);
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await axios.get<KakaoUserInfo>(
        `${this.kakaoApiUrl}/v2/user/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      // ✅ 사용자 ID 검증 추가
      if (!response.data.id) {
        throw new HttpException(
          '카카오 사용자 정보를 가져올 수 없습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('카카오 사용자 정보 조회 실패', error);
      this.handleKakaoError(error);
    }
  }

  /**
   * 카카오 연결 해제 (회원 탈퇴)
   */
  async kakaoUnlink(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${this.kakaoApiUrl}/v1/user/unlink`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      this.logger.log('카카오 연결 해제 성공');
    } catch (error) {
      this.logger.error('카카오 연결 해제 실패', error);
      throw new HttpException('카카오 연결 해제 실패', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 에러 핸들링
   */
  private handleKakaoError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status =
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      // ✅ 카카오 에러 응답 구조에 맞게 개선
      const errorData = axiosError.response?.data as any;
      const message =
        errorData?.error_description ||
        errorData?.error ||
        '카카오 API 요청 실패';

      this.logger.error(`카카오 API 에러: ${status} - ${message}`);
      throw new HttpException(message, status);
    }

    throw new HttpException(
      '카카오 로그인 처리 중 오류가 발생했습니다.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
