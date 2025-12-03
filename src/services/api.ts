// API_URL puede incluir o no /api al final, lo agregamos automáticamente si falta
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Asegurar que termine en /api
if (!API_URL.endsWith('/api')) {
  // Si termina con /, quitar el / y agregar /api
  // Si no termina con /, agregar /api
  API_URL = API_URL.replace(/\/$/, '') + '/api';
}

// Log para debug
console.log('API_URL configurada:', API_URL);

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('cardly_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_URL}${endpoint}`;
    
    // Log detallado para debug (siempre en producción también para troubleshooting)
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      endpoint,
      API_URL,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError: any) {
      // Error de red (CORS, conexión, etc.)
      throw new Error(`Error de conexión: ${networkError.message || 'No se pudo conectar al servidor'}`);
    }

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || `HTTP error! status: ${response.status}`;
      } catch (e) {
        // Si la respuesta no es JSON, intentar obtener el texto
        try {
          const text = await response.text();
          errorMessage = text || `HTTP error! status: ${response.status}`;
        } catch (textError) {
          // Si todo falla, usar el mensaje genérico con el status
          errorMessage = `Error ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
      }
      
      // Agregar información de la URL para debug
      const fullErrorMessage = response.status === 404 
        ? `Error 404: Ruta no encontrada. URL: ${url}. Verifica que VITE_API_URL esté configurada correctamente.`
        : `Error ${response.status}: ${errorMessage}`;
      
      throw new Error(fullErrorMessage);
    }

    return response.json();
  }

  // Auth
  async register(name: string, email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      localStorage.setItem('cardly_token', data.token);
      localStorage.setItem('cardly_user', JSON.stringify(data.user));
    }
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('cardly_token', data.token);
      localStorage.setItem('cardly_user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    localStorage.removeItem('cardly_token');
    localStorage.removeItem('cardly_user');
  }

  // Users
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateUser(data: Partial<{ name: string; email: string; photo: string; plan: string }>) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Collections
  async getCollections() {
    return this.request<any[]>('/collections');
  }

  async getCollection(id: string) {
    return this.request(`/collections/${id}`);
  }

  async createCollection(name: string) {
    return this.request('/collections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateCollection(id: string, data: Partial<{ name: string; progress: number }>) {
    return this.request(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string) {
    return this.request(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  // Cards
  async getCards(collectionId: string) {
    return this.request(`/cards/collection/${collectionId}`);
  }

  async createCard(collectionId: string, front: string, back: string) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify({ collectionId, front, back }),
    });
  }

  async createBulkCards(collectionId: string, cards: Array<{ front: string; back: string }>) {
    return this.request('/cards/bulk', {
      method: 'POST',
      body: JSON.stringify({ collectionId, cards }),
    });
  }

  async updateCard(id: string, data: Partial<{ front: string; back: string }>) {
    return this.request(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCard(id: string) {
    return this.request(`/cards/${id}`, {
      method: 'DELETE',
    });
  }

  // Spaced Repetition
  async getCardsForReview(collectionId: string) {
    return this.request(`/cards/collection/${collectionId}/review`);
  }

  async reviewCard(cardId: string, quality: 'again' | 'hard' | 'good' | 'easy') {
    return this.request(`/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
  }

  // OCR
  async extractText(file: File): Promise<{ text: string; length: number }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/ocr/extract`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // AI
  async generateCards(
    text: string,
    collectionId: string,
    numCards: number,
    difficulty: 'facil' | 'media' | 'dificil',
    collectionName: string
  ) {
    return this.request('/ai/generate-cards', {
      method: 'POST',
      body: JSON.stringify({
        text,
        collectionId,
        numCards,
        difficulty,
        collectionName,
      }),
    });
  }
}

export const api = new ApiService();

