// social/naver.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email: string;
    name: string;
    nickname: string;
    profile_image?: string;
    age?: string;
    gender?: string;
    birthday?: string;
    birthyear?: string;
    mobile?: string;
  };
}

@Injectable()
export class NaverService {
  private readonly logger = new Logger(NaverService.name);
  private readonly naverAuthUrl = 'https://nid.naver.com/oauth2.0';
  private readonly naverApiUrl = 'https://openapi.naver.com/v1/nid/me';

  constructor(private configService: ConfigService) {}

  /**
   * 네이버 로그인 URL 생성
   */
  getNaverLoginUrl(): string {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const redirectUri = this.configService.get<string>('NAVER_REDIRECT_URI');

    // ✅ undefined 체크 추가
    if (!clientId || !redirectUri) {
      throw new HttpException(
        '네이버 로그인 설정이 올바르지 않습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const state = this.generateRandomState(); // CSRF 방지

    const url = new URL(`${this.naverAuthUrl}/authorize`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('state', state);

    return url.toString();
  }

  /**
   * 인가 코드로 액세스 토큰 발급
   */
  async getNaverToken(
    code: string,
    state: string,
  ): Promise<NaverTokenResponse> {
    try {
      const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'NAVER_CLIENT_SECRET',
      );

      // ✅ undefined 체크 추가
      if (!clientId || !clientSecret) {
        throw new HttpException(
          '네이버 로그인 설정이 올바르지 않습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // ✅ State 검증 로직 필요 (실무에서는 Redis나 세션에 저장했던 state와 비교)
      if (!state) {
        throw new HttpException(
          'State 파라미터가 누락되었습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = await axios.get<NaverTokenResponse>(
        `${this.naverAuthUrl}/token`,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            state,
          },
        },
      );

      // ✅ 네이버 API는 에러도 200으로 응답할 수 있음
      if (!response.data.access_token) {
        throw new HttpException(
          '네이버 토큰 발급에 실패했습니다.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('네이버 토큰 발급 실패', error);
      this.handleNaverError(error);
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  async getNaverUserInfo(accessToken: string): Promise<NaverUserInfo> {
    try {
      const response = await axios.get<NaverUserInfo>(this.naverApiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // ✅ 네이버 API 응답 코드 검증
      if (response.data.resultcode !== '00') {
        this.logger.error(
          `네이버 API 에러: ${response.data.resultcode} - ${response.data.message}`,
        );
        throw new HttpException(
          response.data.message || '네이버 사용자 정보 조회 실패',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('네이버 사용자 정보 조회 실패', error);
      this.handleNaverError(error);
    }
  }

  /**
   * 토큰 삭제 (로그아웃)
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'NAVER_CLIENT_SECRET',
      );

      // ✅ undefined 체크 추가
      if (!clientId || !clientSecret) {
        throw new HttpException(
          '네이버 로그인 설정이 올바르지 않습니다.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await axios.get(`${this.naverAuthUrl}/token`, {
        params: {
          grant_type: 'delete',
          client_id: clientId,
          client_secret: clientSecret,
          access_token: accessToken,
          service_provider: 'NAVER',
        },
      });
    } catch (error) {
      this.logger.error('네이버 토큰 삭제 실패', error);
      throw new HttpException('네이버 로그아웃 실패', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 랜덤 State 생성 (CSRF 방지)
   * ✅ 실무에서는 UUID나 crypto 사용 권장
   */
  private generateRandomState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    ); // ✅ 길이 늘림
  }

  /**
   * 에러 핸들링
   */
  private handleNaverError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status =
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      // ✅ 네이버 API 에러 응답 구조에 맞게 수정
      const errorData = axiosError.response?.data as any;
      const message =
        errorData?.error_description ||
        errorData?.message ||
        '네이버 API 요청 실패';

      this.logger.error(`네이버 API 에러: ${status} - ${message}`);
      throw new HttpException(message, status);
    }

    throw new HttpException(
      '네이버 로그인 처리 중 오류가 발생했습니다',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
