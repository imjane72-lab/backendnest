// social/google.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private readonly googleAuthUrl =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly googleTokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly googleUserInfoUrl =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(private configService: ConfigService) {}

  /**
   * 구글 로그인 URL 생성
   */
  getGoogleLoginUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new HttpException(
        '구글 로그인 설정이 올바르지 않습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = new URL(this.googleAuthUrl);
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'email profile');
    url.searchParams.append('access_type', 'offline'); // refresh_token 받기
    url.searchParams.append('prompt', 'consent'); // 항상 동의 화면 표시

    return url.toString();
  }

  /**
   * 인가 코드로 액세스 토큰 발급
   */
  async getGoogleToken(code: string): Promise<GoogleTokenResponse> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );
      const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

      // ✅ undefined 체크
      if (!clientId || !clientSecret || !redirectUri) {
        throw new HttpException(
          '구글 로그인 설정이 올바르지 않습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const response = await axios.post<GoogleTokenResponse>(
        this.googleTokenUrl,
        {
          code,
          client_id: clientId, // ✅ 중복 제거 - 위에서 검증한 변수 사용
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // ✅ 응답 검증 추가
      if (!response.data.access_token) {
        throw new HttpException(
          '구글 토큰 발급에 실패했습니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('구글 토큰 발급 실패', error);
      this.handleGoogleError(error);
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get<GoogleUserInfo>(this.googleUserInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // ✅ 이메일 검증 체크 추가
      if (!response.data.email) {
        throw new HttpException(
          '사용자 이메일 정보를 가져올 수 없습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('구글 사용자 정보 조회 실패', error);
      this.handleGoogleError(error);
    }
  }

  /**
   * 토큰 폐기 (로그아웃)
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
        {},
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error) {
      this.logger.error('구글 토큰 폐기 실패', error);
      throw new HttpException('구글 로그아웃 실패', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 에러 핸들링
   */
  private handleGoogleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status =
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      // ✅ 구글 에러 응답 구조에 맞게 개선
      const errorData = axiosError.response?.data as any;
      const message =
        errorData?.error_description ||
        errorData?.error ||
        '구글 API 요청 실패';

      this.logger.error(`구글 API 에러: ${status} - ${message}`);
      throw new HttpException(message, status);
    }

    throw new HttpException(
      '구글 로그인 처리 중 오류가 발생했습니다',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
