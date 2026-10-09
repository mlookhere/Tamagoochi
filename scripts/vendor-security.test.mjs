import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const micromatchRequire = createRequire(require.resolve('micromatch'));
const braces = micromatchRequire('braces');
const ASN1 = require('node-forge/lib/asn1');
const MD = require('node-forge/lib/md.all');
const RSA = require('node-forge/lib/rsa');

test('patched braces rejects excessive recursive nesting', () => {
  const nested = '{'.repeat(101) + 'a,b' + '}'.repeat(101);
  assert.throws(() => braces.parse(nested), /exceeds max depth/);
});

test('patched node-forge rejects nested DigestAlgorithm garbage', () => {
  const keyPair = RSA.generateKeyPair({ bits: 768, e: 3 });
  const md = MD.sha256.create();
  md.update('vendor-security-regression');
  const digest = md.digest().getBytes();
  const digestAlgorithm = ASN1.create(
    ASN1.Class.UNIVERSAL,
    ASN1.Type.SEQUENCE,
    true,
    [
      ASN1.create(
        ASN1.Class.UNIVERSAL,
        ASN1.Type.OID,
        false,
        ASN1.oidToDer('2.16.840.1.101.3.4.2.1').getBytes(),
      ),
      ASN1.create(ASN1.Class.UNIVERSAL, ASN1.Type.NULL, false, ''),
      ASN1.create(ASN1.Class.UNIVERSAL, ASN1.Type.OCTETSTRING, false, 'x'),
    ],
  );
  const digestInfo = ASN1.create(ASN1.Class.UNIVERSAL, ASN1.Type.SEQUENCE, true, [
    digestAlgorithm,
    ASN1.create(ASN1.Class.UNIVERSAL, ASN1.Type.OCTETSTRING, false, digest),
  ]);
  const der = ASN1.toDer(digestInfo).getBytes();
  const encodedLength = Math.ceil(keyPair.publicKey.n.bitLength() / 8);
  const paddingLength = encodedLength - der.length - 3;

  assert.ok(paddingLength >= 8);
  const encoded = '\x00\x01' + '\xff'.repeat(paddingLength) + '\x00' + der;
  const signature = RSA.encrypt(encoded, keyPair.privateKey, false);

  assert.throws(
    () =>
      keyPair.publicKey.verify(digest, signature, undefined, {
        _parseAllDigestBytes: true,
        _skipPaddingChecks: true,
      }),
    /valid RSASSA-PKCS1-v1_5 DigestInfo value/,
  );
});
