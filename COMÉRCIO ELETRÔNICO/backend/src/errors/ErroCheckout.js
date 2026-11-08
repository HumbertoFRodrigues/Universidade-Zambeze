export class ErroCheckout extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ErroCheckout'
    this.status = status
  }
}
