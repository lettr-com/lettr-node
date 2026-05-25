import type { HttpClient } from "./http";
import type {
  AudienceContact,
  BulkAttachContactsListsData,
  BulkAudienceContactListsRequest,
  BulkCreateAudienceContactsData,
  BulkCreateAudienceContactsRequest,
  BulkDetachContactsListsData,
  CreateAudienceContactRequest,
  ListAudienceContactsData,
  ListAudienceContactsParams,
  Result,
  UpdateAudienceContactRequest,
} from "./types";

export class AudienceContacts {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListAudienceContactsParams
  ): Promise<Result<ListAudienceContactsData>> {
    return this.http.request<ListAudienceContactsData>(
      "GET",
      "/audience/contacts",
      { query: params as Record<string, string | number | undefined> }
    );
  }

  async create(
    data: CreateAudienceContactRequest
  ): Promise<Result<AudienceContact>> {
    return this.http.request<AudienceContact>("POST", "/audience/contacts", {
      body: data,
    });
  }

  async bulkCreate(
    data: BulkCreateAudienceContactsRequest
  ): Promise<Result<BulkCreateAudienceContactsData>> {
    return this.http.request<BulkCreateAudienceContactsData>(
      "POST",
      "/audience/contacts/bulk",
      { body: data }
    );
  }

  async get(contactId: string): Promise<Result<AudienceContact>> {
    return this.http.request<AudienceContact>(
      "GET",
      `/audience/contacts/${encodeURIComponent(contactId)}`
    );
  }

  async update(
    contactId: string,
    data: UpdateAudienceContactRequest
  ): Promise<Result<AudienceContact>> {
    return this.http.request<AudienceContact>(
      "PATCH",
      `/audience/contacts/${encodeURIComponent(contactId)}`,
      { body: data }
    );
  }

  async delete(contactId: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/contacts/${encodeURIComponent(contactId)}`
    );
  }

  async attachList(
    contactId: string,
    listId: string
  ): Promise<Result<{ message: string }>> {
    return this.http.request<{ message: string }>(
      "POST",
      `/audience/contacts/${encodeURIComponent(contactId)}/lists/${encodeURIComponent(listId)}`,
      { unwrap: false }
    );
  }

  async detachList(
    contactId: string,
    listId: string
  ): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/contacts/${encodeURIComponent(contactId)}/lists/${encodeURIComponent(listId)}`
    );
  }

  async bulkAttachLists(
    data: BulkAudienceContactListsRequest
  ): Promise<Result<BulkAttachContactsListsData>> {
    return this.http.request<BulkAttachContactsListsData>(
      "POST",
      "/audience/contacts/lists/bulk",
      { body: data }
    );
  }

  async bulkDetachLists(
    data: BulkAudienceContactListsRequest
  ): Promise<Result<BulkDetachContactsListsData>> {
    return this.http.request<BulkDetachContactsListsData>(
      "DELETE",
      "/audience/contacts/lists/bulk",
      { body: data }
    );
  }

  async subscribeTopic(
    contactId: string,
    topicId: string
  ): Promise<Result<{ message: string }>> {
    return this.http.request<{ message: string }>(
      "POST",
      `/audience/contacts/${encodeURIComponent(contactId)}/topics/${encodeURIComponent(topicId)}`,
      { unwrap: false }
    );
  }

  async unsubscribeTopic(
    contactId: string,
    topicId: string
  ): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/contacts/${encodeURIComponent(contactId)}/topics/${encodeURIComponent(topicId)}`
    );
  }
}
