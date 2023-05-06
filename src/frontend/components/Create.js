import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { Buffer } from "buffer";

const projectId = "2OCTA5yF8788URnY0U168Eb8j7l"
const projectSecretKey = "44ad97a83ab8ebe946d0c6253d6b5c25"
const subdomain = "https://kartik.infura-ipfs.io"

const authorization = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString("base64")}`;
const client = ipfsHttpClient({ host: 'ipfs.infura.io', port: '5001', protocol: 'https', headers: { authorization: authorization }});

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`${subdomain}/ipfs/${result.path}`);
      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  }

  const createNFT = async () => {
    if (!image || !price || !name || !description) return
    try{
      const result = await client.add(JSON.stringify({image, price, name, description}))
      console.log("create nft result: ", result)
      mintThenList(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
  }

  const mintThenList = async (result) => {
    const uri = `${subdomain}/ipfs/${result.path}`;
    console.log("uri: ", uri)
    // mint nft 
    await(await nft.mint(uri, {maxFeePerGas: 9000000000})).wait()
    console.log("mint nft")
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    console.log("getting token id")

    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true, { maxFeePerGas: 9000000000 })).wait()
    console.log("approving marketplace to sell it")

    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice, { maxFeePerGas: 9000000000 })).wait()
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create