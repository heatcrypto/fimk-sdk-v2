/**
 * The MIT License (MIT)
 * Copyright (c) 2020 heatcrypto.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * */
import { passphraseEncrypt, PassphraseEncryptedMessage, passphraseDecrypt } from "./crypto"
import { isDefined, convertToQNT } from "./utils"
import { TransactionImpl, Builder } from "./builder"
import { Transaction } from "./transaction"
import {
  AssetTransfer,
  ColoredCoinsAskOrderPlacement,
  ColoredCoinsBidOrderPlacement,
  ColoredCoinsAskOrderCancellation,
  ColoredCoinsBidOrderCancellation,
  ORDINARY_PAYMENT,
  ARBITRARY_MESSAGE
} from "./attachment"
import { Fee } from "./fee"

export interface ConfigArgs {
  isTestnet?: boolean
  baseURL?: string
  websocketURL?: string
}

export class Configuration {
  isTestnet = false
  constructor(args?: ConfigArgs) {
    if (args) {
      if (isDefined(args.isTestnet)) this.isTestnet = !!args.isTestnet
    }
  }
}

export class FimkSDK {  
  public config: Configuration

  constructor(config?: Configuration) {
    const config_ = config ? config : new Configuration()
    this.config = config_
  }

  public parseTransactionBytes(transactionBytesHex: string) {
    return TransactionImpl.parse(transactionBytesHex, this.config.isTestnet)
  }

  public parseTransactionJSON(json: { [key: string]: any }) {
    return TransactionImpl.parseJSON(json, this.config.isTestnet)
  }

  public passphraseEncrypt(plainText: string, passphrase: string) {
    return passphraseEncrypt(plainText, passphrase).encode()
  }

  public passphraseDecrypt(cipherText: string, passphrase: string) {
    let encrypted = PassphraseEncryptedMessage.decode(cipherText)
    return passphraseDecrypt(encrypted, passphrase)
  }

  public payment(recipientOrRecipientPublicKey: string, amount: string) {
    return new Transaction(
      this,
      recipientOrRecipientPublicKey,
      new Builder()
        .isTestnet(this.config.isTestnet)
        .attachment(ORDINARY_PAYMENT)
        .amountHQT(convertToQNT(amount))
    )
  }

  public arbitraryMessage(recipientOrRecipientPublicKey: string, message: string) {
    return new Transaction(
      this,
      recipientOrRecipientPublicKey,
      new Builder()
        .isTestnet(this.config.isTestnet)
        .attachment(ARBITRARY_MESSAGE)
        .amountHQT("0")
    ).publicMessage(message)
  }

  public privateMessage(recipientPublicKey: string, message: string) {
    return new Transaction(
      this,
      recipientPublicKey,
      new Builder()
        .isTestnet(this.config.isTestnet)
        .attachment(ARBITRARY_MESSAGE)
        .amountHQT("0")
    ).privateMessage(message)
  }

  public privateMessageToSelf(message: string) {
    return new Transaction(
      this,
      null, // if null and provide private message then to send encrypted message to self
      new Builder()
        .isTestnet(this.config.isTestnet)
        .attachment(ARBITRARY_MESSAGE)
        .amountHQT("0")
    ).privateMessageToSelf(message)
  }

  public assetTransfer(
    recipientOrRecipientPublicKey: string,
    assetId: string,
    quantity: string,
    feeHQT?: string
  ) {
    let builder = new Builder()
      .isTestnet(this.config.isTestnet)
      .attachment(new AssetTransfer().init(assetId, quantity))
      .amountHQT("0")
      .feeHQT(feeHQT ? feeHQT : Fee.ASSET_TRANSFER_FEE)
    return new Transaction(this, recipientOrRecipientPublicKey, builder)
  }

  public placeAskOrder(
    currencyId: string,
    assetId: string,
    quantity: string,
    price: string,
    expiration: number
  ) {
    let builder = new Builder()
      .isTestnet(this.config.isTestnet)
      .attachment(
        new ColoredCoinsAskOrderPlacement().init(currencyId, assetId, quantity, price, expiration)
      )
      .amountHQT("0")
      .feeHQT("10000000")
    return new Transaction(this, "0", builder)
  }

  public placeBidOrder(
    currencyId: string,
    assetId: string,
    quantity: string,
    price: string,
    expiration: number
  ) {
    let builder = new Builder()
      .isTestnet(this.config.isTestnet)
      .attachment(
        new ColoredCoinsBidOrderPlacement().init(currencyId, assetId, quantity, price, expiration)
      )
      .amountHQT("0")
      .feeHQT("10000000")
    return new Transaction(this, "0", builder)
  }

  public cancelAskOrder(orderId: string) {
    let builder = new Builder()
      .isTestnet(this.config.isTestnet)
      .attachment(new ColoredCoinsAskOrderCancellation().init(orderId))
      .amountHQT("0")
      .feeHQT("10000000")
    return new Transaction(this, "0", builder)
  }

  public cancelBidOrder(orderId: string) {
    let builder = new Builder()
      .isTestnet(this.config.isTestnet)
      .attachment(new ColoredCoinsBidOrderCancellation().init(orderId))
      .amountHQT("0")
      .feeHQT("10000000")
    return new Transaction(this, "0", builder)
  }
}
