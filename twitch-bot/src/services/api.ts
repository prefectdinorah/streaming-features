import axios, { AxiosError } from 'axios'
import { config } from '../config.js'

/**
 * Типы для API responses
 */
interface AddVideoResponse {
  success: boolean
  data?: {
    id: string
    position: number
    title: string
  }
  error?: string
}

/**
 * Добавляет YouTube видео в очередь через Vercel API
 *
 * @param youtubeUrl - YouTube URL
 * @param requestedBy - Twitch username
 * @returns Response от API
 */
export async function addVideoToQueue(
  youtubeUrl: string,
  requestedBy: string
): Promise<AddVideoResponse> {
  try {
    const response = await axios.post<AddVideoResponse>(
      `${config.api.baseUrl}/api/queue/add`,
      {
        youtubeUrl,
        requestedBy,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.api.apiKey,
        },
        timeout: 15000, // 15 секунд timeout
      }
    )

    return response.data
  } catch (error) {
    // Обработка ошибок Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AddVideoResponse>

      // Если сервер вернул ответ с ошибкой
      if (axiosError.response?.data) {
        return axiosError.response.data
      }

      // Ошибки сети
      if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Тайм-аут запроса. Сервер не отвечает.',
        }
      }

      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Не удалось подключиться к серверу. Проверьте API_BASE_URL.',
        }
      }
    }

    // Неизвестная ошибка
    console.error('Unexpected error in addVideoToQueue:', error)
    return {
      success: false,
      error: 'Неизвестная ошибка. Попробуйте позже.',
    }
  }
}

/**
 * Получает текущий статус плеера
 *
 * @returns Response от API
 */
export async function getPlayerStatus() {
  try {
    const response = await axios.get(`${config.api.baseUrl}/api/player/status`, {
      timeout: 10000,
    })

    return response.data
  } catch (error) {
    console.error('Error getting player status:', error)
    return null
  }
}
