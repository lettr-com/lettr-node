import { Emails } from "./emails";

const BASE_URL = "https://app.lettr.com/api";

export class Lettr {
  public readonly emails: Emails;

  constructor(apiKey: string) {
    this.emails = new Emails(BASE_URL, apiKey);
  }
}
