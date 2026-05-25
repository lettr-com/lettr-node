import type { HttpClient } from "./http";
import { AudienceLists } from "./audience-lists";
import { AudienceContacts } from "./audience-contacts";
import { AudienceTopics } from "./audience-topics";
import { AudienceProperties } from "./audience-properties";
import { AudienceSegments } from "./audience-segments";

export class Audience {
  public readonly lists: AudienceLists;
  public readonly contacts: AudienceContacts;
  public readonly topics: AudienceTopics;
  public readonly properties: AudienceProperties;
  public readonly segments: AudienceSegments;

  constructor(http: HttpClient) {
    this.lists = new AudienceLists(http);
    this.contacts = new AudienceContacts(http);
    this.topics = new AudienceTopics(http);
    this.properties = new AudienceProperties(http);
    this.segments = new AudienceSegments(http);
  }
}
