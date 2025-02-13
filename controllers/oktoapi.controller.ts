import { Request, Response } from "express";
import axios from "axios";
import { config } from "dotenv";
config();

const oktoBaseUrl = process.env.OktoBaseUrl;
const XApiKey = process.env.Okto_APIKEY;
//console.log("base url", oktoBaseUrl);

interface transactionObject{
  "bulk_order_id":string,
  "job_id": string,
  "status": string,
  "transaction_hash": string,
  "order_type": string,
  "network_id": string
}

export const createTreasuryWallet = async (req: Request, res: Response) => {
  try {
      const { network_name, purpose } = req.body;

      if (!network_name || !purpose) {
          return res.status(400).json({
              success: false,
              message: "Network name or purpose is missing.",
          });
      }

      if (!oktoBaseUrl || !XApiKey) {
          return res.status(500).json({
              success: false,
              message: "Missing API base URL or API key.",
          });
      }

      console.log("baseurl:", oktoBaseUrl, "APIKey:", XApiKey);

      const createCW = await axios.post(
          `${oktoBaseUrl}/s2s/api/v1/wallet`,
          { network_name, purpose },
          {
              headers: {
                  "Content-Type": "application/json",
                  "X-Api-Key": XApiKey,
              },
          }
      );

      return res.status(200).json({
          success: true,
          message: "Treasury wallet created successfully.",
          data: createCW.data,
      });
  } catch (error: any) {
      console.error("Error creating treasury wallet:", error?.response?.data || error.message);

      return res.status(error?.response?.status || 500).json({
          success: false,
          message: "Error while creating treasury wallet",
          error: error?.response?.data || error.message,
      });
  }
};

export const executeRawTransaction = async(req:Request,res:Response)=>
{
    try {
        const {network_name,walletAddress,data,twUserId,cwAdd} = req.body;
        if(!network_name || !walletAddress || !data || !twUserId || !cwAdd)
        {
            return res.status(400).json({
                success:false,
                message:"network name,walletAddress, data, twUserId, cwAddress required !"
            })
        }
        const tx = await axios.post(`${oktoBaseUrl}/s2s/api/v1/rawtransaction/execute/${twUserId}`,
            {
                "network_name":network_name,
                "transaction":{
                  "from":cwAdd, // central wallet
                  "to": "0x3193852D4ac3154C001ca420841118917Efed680", // contract address
                  "data": data, //abi encoded data
                  "value": "0",
                }
              },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key":XApiKey, //okto API key
              },
            }
        )

        return res.status(200).json({
            success:true,
            message:"orderId created",
            data:tx.data
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:"Error while executing transaction",
            error
        })
    }
}


export const getBulkOrderDetails  = async(req:Request, res:Response)=>{
    try {
        const {twUserId,bulkOrderId} = req.params;

        if(!bulkOrderId || !twUserId)
        {
            return res.status(400).json({
                success:false,
                message:"bulkOrderId and userId required"
            })
        }

        const response  = await axios.get(`${oktoBaseUrl}/s2s/api/v2/bulk_order_details/${twUserId}?order_id=${bulkOrderId}`,
          {
            headers:{
              "X-Api-Key":XApiKey
            }
          }
        )
        if(response.data.data.open.length>0)
        {
        return res.status(200).json({
          success:true,
          status:"executing",
          data:response.data.data.open[0]
        })
      }
        else{
          const filterData = response.data.data.executed.filter((tx:transactionObject)=>tx.bulk_order_id===bulkOrderId)
          if(filterData)
          {
          return res.status(200).json({
            sucess:true,
            status:"success",
            data:filterData
          })
        }else{
          return res.status(200).json({
            sucess:true,
            status:"success",
            message:"No filtered data found correspond to bulk orderId",
          })
        }
        }
    } catch (error) {
        return res.status(500).json({
          success:false,
          message:"error while fetching bulk order details",
          error:error
        })
    }
}

export const readContract = async(req:Request,res:Response)=>{
  try {
    const {network_name,data} = req.body;
    if(!network_name || !data)
    {
      return res.status(400).json({
        success:false,
        message:"network name and data are required !"
      })
    }
    const tx = await axios.post(`${oktoBaseUrl}/s2s/api/v2/readContractData`,{
      "network_name":network_name,
      "data":data
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key":XApiKey,
      },
    }
    )

    return res.status(200).json({
      success:true,
      data:tx.data
    })
    
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while reading smart contract",
      error:error
    })
  }
}


