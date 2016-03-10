signup

curl -X POST \
  -H "X-Parse-Application-Id: KXCr8DGdScgAa75yxfdpQONBf8poQNgzeCohDgYZ" \
  -H "X-Parse-REST-API-Key: r2aua4IVYIfAJB68djzurIo2fJy3J6Tu7Z0r7WGM" \
  -H "X-Parse-Revocable-Session: 1" \
  -H "Content-Type: application/json" \
  -d '{"username":"foo1","password":"bar1"}' \
  http://localhost:1337/1/users

{"objectId":"EEyiuwNk6M","createdAt":"2016-03-10T11:30:11.340Z","sessionToken":"r:aa1474c2e2954c3220a99ed87ce8b32e"}

-------------------

login

curl -X GET \
  -H "X-Parse-Application-Id: KXCr8DGdScgAa75yxfdpQONBf8poQNgzeCohDgYZ" \
  -H "X-Parse-REST-API-Key: r2aua4IVYIfAJB68djzurIo2fJy3J6Tu7Z0r7WGM" \
  -H "X-Parse-Revocable-Session: 1" \
  -G \
  --data-urlencode 'username=foo1' \
  --data-urlencode 'password=bar1' \
  http://localhost:1337/1/login

{"ACL":{"EEyiuwNk6M":{"read":true,"write":true},"*":{"read":true}},"objectId":"EEyiuwNk6M","username":"foo1","updatedAt":"2016-03-10T11:30:11.340Z","createdAt":"2016-03-10T11:30:11.340Z","sessionToken":"r:71801fb065dbdedafac42a74e3e32370"}

-------------------

create key

curl -X POST \
  -H "X-Parse-Application-Id: KXCr8DGdScgAa75yxfdpQONBf8poQNgzeCohDgYZ" \
  -H "X-Parse-REST-API-Key: r2aua4IVYIfAJB68djzurIo2fJy3J6Tu7Z0r7WGM" \
  -H "X-Parse-Session-Token: r:ba3f692914eded44806804cf66b6125b" \
  -H "Content-Type: application/json" \
  -d '{"name":"keyfoo1"}' \
  http://localhost:1337/1/account/keys

-------------------

get keys

curl -X GET \
  -H "X-Parse-Application-Id: KXCr8DGdScgAa75yxfdpQONBf8poQNgzeCohDgYZ" \
  -H "X-Parse-REST-API-Key: r2aua4IVYIfAJB68djzurIo2fJy3J6Tu7Z0r7WGM" \
  -H "X-Parse-Session-Token: r:ba3f692914eded44806804cf66b6125b" \
  http://localhost:1337/1/account/keys

[{"id":"56e18427beee9fe725fe0519","name":"keyfoo1","token":"3570b76ec5a5502bd878f8e9cb0cc3ca","scope":"apps","expiresAt":"2017-03-10T14:26:47.095Z"}]

-------------------
delete key

curl -X DELETE \
  -H "X-Parse-Application-Id: KXCr8DGdScgAa75yxfdpQONBf8poQNgzeCohDgYZ" \
  -H "X-Parse-REST-API-Key: r2aua4IVYIfAJB68djzurIo2fJy3J6Tu7Z0r7WGM" \
  -H "X-Parse-Session-Token: r:ba3f692914eded44806804cf66b6125b" \
  http://localhost:1337/1/account/keys/56e18427beee9fe725fe0519

