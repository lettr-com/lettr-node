import type { HttpClient } from "./http";
import type {
  AudienceContact,
  BulkAttachContactsListsData,
  BulkAudienceContactListsRequest,
  BulkAudienceContactTopicsRequest,
  BulkCreateAudienceContactsData,
  BulkCreateAudienceContactsRequest,
  BulkDetachContactsListsData,
  BulkSubscribeContactsTopicsData,
  BulkUnsubscribeContactsTopicsData,
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

  /**
   * Create a single contact.
   *
   * An email already in the team's audience comes back as a 409 with
   * `error_code: "resource_already_exists"` — see `isContactAlreadyExistsError()`.
   * That is a client-correctable condition, not an outage: **do not retry it.**
   * Use `update()` instead, or `bulkCreate()` with `update_existing: true`.
   */
  async create(
    data: CreateAudienceContactRequest
  ): Promise<Result<AudienceContact>> {
    return this.http.request<AudienceContact>("POST", "/audience/contacts", {
      body: data,
    });
  }

  /**
   * Create up to 1000 contacts in one request.
   *
   * Rows that fail validation are skipped, not fatal: the call still returns
   * HTTP 201 and reports them in `data.errors`. A null `result.error` does not
   * mean every row landed — check `data.errors.length`.
   */
  async bulkCreate(
    data: BulkCreateAudienceContactsRequest
  ): Promise<Result<BulkCreateAudienceContactsData>> {
    const result = await this.http.request<BulkCreateAudienceContactsData>(
      "POST",
      "/audience/contacts/bulk",
      { body: data }
    );

    if (result.error !== null) return result;

    // `updated`, `error_count`, `errors` and `contacts` arrived with TPL-2105.
    // Defaulting them here keeps `data.errors.length` safe against an API
    // deployment that predates the change, so callers never branch on it.
    const received = result.data;

    return {
      data: {
        ...received,
        updated: received.updated ?? 0,
        error_count: received.error_count ?? 0,
        errors: received.errors ?? [],
        contacts: received.contacts ?? [],
      },
      error: null,
    };
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

  /**
   * Subscribe every `contact_ids × topic_ids` combination (up to 1000 × 50).
   *
   * Feed it `contacts.map((c) => c.id)` from a `bulkCreate()` result — no id
   * lookup needed.
   */
  async bulkSubscribeTopics(
    data: BulkAudienceContactTopicsRequest
  ): Promise<Result<BulkSubscribeContactsTopicsData>> {
    return this.http.request<BulkSubscribeContactsTopicsData>(
      "POST",
      "/audience/contacts/topics/bulk",
      { body: data }
    );
  }

  /**
   * Unsubscribe every `contact_ids × topic_ids` combination. Pairs that do not
   * exist are ignored.
   *
   * Note this is a DELETE with a request body — `fetch` handles that fine, but
   * a proxy in front of your app may not.
   */
  async bulkUnsubscribeTopics(
    data: BulkAudienceContactTopicsRequest
  ): Promise<Result<BulkUnsubscribeContactsTopicsData>> {
    return this.http.request<BulkUnsubscribeContactsTopicsData>(
      "DELETE",
      "/audience/contacts/topics/bulk",
      { body: data }
    );
  }
}
