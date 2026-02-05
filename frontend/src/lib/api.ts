import { Community, CommunitySnippet } from "../atoms/communitiesAtom";
import { Post } from "../atoms/postsAtom";
import { User } from "../types/user";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const apiFetch = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed.");
  }

  return response.json();
};

export const authApi = {
  signup: (email: string, password: string, displayName?: string) =>
    apiFetch<User>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    }),
  login: (email: string, password: string) =>
    apiFetch<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  resetPassword: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

export const communityApi = {
  list: (limit = 10) =>
    apiFetch<Community[]>(`/api/communities?limit=${limit}`),
  get: (id: string) => apiFetch<Community>(`/api/communities/${id}`),
  create: (payload: { id: string; creatorId: string; privacyType: string }) =>
    apiFetch<Community>("/api/communities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateImage: (id: string, imageURL: string) =>
    apiFetch<Community>(`/api/communities/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ imageURL }),
    }),
  join: (id: string, userId: string) =>
    apiFetch<CommunitySnippet>(`/api/communities/${id}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  leave: (id: string, userId: string) =>
    apiFetch<{ success: boolean }>(
      `/api/communities/${id}/join?userId=${userId}`,
      {
        method: "DELETE",
      }
    ),
  snippets: (userId: string) =>
    apiFetch<CommunitySnippet[]>(`/api/users/${userId}/communities`),
};

export const postApi = {
  list: (communityId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (communityId) params.set("communityId", communityId);
    if (userId) params.set("userId", userId);
    const query = params.toString();
    return apiFetch<Post[]>(`/api/posts${query ? `?${query}` : ""}`);
  },
  get: (postId: string, userId?: string) => {
    const query = userId ? `?userId=${userId}` : "";
    return apiFetch<Post>(`/api/posts/${postId}${query}`);
  },
  create: (payload: {
    communityId: string;
    creatorId: string;
    title: string;
    body?: string;
    imageURL?: string;
  }) =>
    apiFetch<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (postId: string) =>
    apiFetch<{ success: boolean }>(`/api/posts/${postId}`, {
      method: "DELETE",
    }),
  vote: (postId: string, userId: string, voteValue: number) =>
    apiFetch<{ id: string; voteValue: number }>(`/api/posts/${postId}/votes`, {
      method: "POST",
      body: JSON.stringify({ userId, voteValue }),
    }),
  removeVote: (postId: string, userId: string) =>
    apiFetch<{ success: boolean }>(
      `/api/posts/${postId}/votes?userId=${userId}`,
      {
        method: "DELETE",
      }
    ),
};

export const commentApi = {
  list: (postId: string) =>
    apiFetch<
      {
        id: string;
        creatorId: string;
        creatorDisplayText: string;
        creatorPhotoURL: string;
        communityId: string;
        postId: string;
        postTitle: string;
        text: string;
        createdAt?: string;
      }[]
    >(`/api/posts/${postId}/comments`),
  create: (postId: string, creatorId: string, text: string) =>
    apiFetch<{
      id: string;
      creatorId: string;
      creatorDisplayText: string;
      creatorPhotoURL: string;
      communityId: string;
      postId: string;
      postTitle: string;
      text: string;
      createdAt?: string;
    }>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ creatorId, text }),
    }),
  remove: (commentId: string) =>
    apiFetch<{ success: boolean }>(`/api/comments/${commentId}`, {
      method: "DELETE",
    }),
};
