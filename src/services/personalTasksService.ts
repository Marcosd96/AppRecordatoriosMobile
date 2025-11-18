import fetchAPI, { API_ENDPOINTS } from '../config/api';
import {
  PersonalTask,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
} from '../types';

type Nullable<T> = T | null | undefined;

export interface CreatePersonalTaskPayload {
  title: string;
  description?: string;
  startDate: Date | string;
  endDate?: Nullable<Date | string>;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: Nullable<number>;
  weekDays?: Nullable<number[]>;
  monthDay?: Nullable<number>;
  priority?: TaskPriority;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

export interface UpdatePersonalTaskPayload
  extends Partial<CreatePersonalTaskPayload> {
  status?: TaskStatus;
}

interface TaskMutationResponse {
  success: boolean;
  data: PersonalTask;
}

const serializePayload = (
  payload: CreatePersonalTaskPayload | UpdatePersonalTaskPayload
) => {
  const entries = Object.entries(payload).map(([key, value]) => {
    if (value === undefined) {
      return [key, value];
    }

    if (key === 'startDate' || key === 'endDate' || key === 'nextOccurrence') {
      if (!value) {
        return [key, null];
      }
      return [key, new Date(value as string | number | Date).toISOString()];
    }

    return [key, value];
  });

  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
};

export const personalTasksService = {
  async getAll(status?: TaskStatus | 'all'): Promise<PersonalTask[]> {
    const endpoint =
      status && status !== 'all'
        ? `${API_ENDPOINTS.personalTasks}?status=${status}`
        : API_ENDPOINTS.personalTasks;

    return fetchAPI<PersonalTask[]>(endpoint);
  },

  async getOne(id: string): Promise<PersonalTask> {
    return fetchAPI<PersonalTask>(API_ENDPOINTS.personalTask(id));
  },

  async getUpcoming(limit?: number): Promise<PersonalTask[]> {
    const endpoint = limit
      ? `${API_ENDPOINTS.personalTasksUpcoming}?limit=${limit}`
      : API_ENDPOINTS.personalTasksUpcoming;
    return fetchAPI<PersonalTask[]>(endpoint);
  },

  async create(payload: CreatePersonalTaskPayload): Promise<PersonalTask> {
    const body = serializePayload(payload);
    const response = await fetchAPI<TaskMutationResponse>(
      API_ENDPOINTS.personalTasks,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async update(
    id: string,
    payload: UpdatePersonalTaskPayload
  ): Promise<PersonalTask> {
    const body = serializePayload(payload);
    const response = await fetchAPI<TaskMutationResponse>(
      API_ENDPOINTS.personalTask(id),
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await fetchAPI(API_ENDPOINTS.personalTask(id), {
      method: 'DELETE',
    });
  },

  async complete(id: string, notes?: string): Promise<void> {
    await fetchAPI(API_ENDPOINTS.personalTaskComplete(id), {
      method: 'POST',
      body: JSON.stringify(notes ? { notes } : {}),
    });
  },

  async pause(id: string): Promise<PersonalTask> {
    return personalTasksService.update(id, { status: 'paused' });
  },

  async resume(id: string): Promise<PersonalTask> {
    return personalTasksService.update(id, { status: 'active' });
  },

  async cancel(id: string): Promise<PersonalTask> {
    return personalTasksService.update(id, { status: 'cancelled' });
  },
};

export type PersonalTasksService = typeof personalTasksService;

