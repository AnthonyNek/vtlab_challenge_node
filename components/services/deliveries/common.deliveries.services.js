import Deliveries from '@/models/Deliveries.model';
import Products from '@/models/Products.model';
const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let sort = { _id: 1 }

  // if date provided, filter by date
  if (req.body.when) {
    query['when'] = {
      '$gte': req.body.when
    }
  };
 if(req.body.dateFrom && req.body.dateTo)
 {
     query['when'] = {
      '$gte': new Date(req.body.dateFrom),
    '$lt': new Date(req.body.dateTo)
     }
 }
  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`
      }
    }
  }
  let productsResult=[];
  
  let deliveries = await Deliveries.find(query).skip(skip).sort(sort).limit(limit);
  deliveries=JSON.parse(JSON.stringify(deliveries));
    
   for await(const entry of deliveries) {
    
    for await(const element of entry.products) {
          let result=  await  Products.find({_id:element})
           productsResult.push({"_id":result[0]._id,"reference": result[0].reference,
          "description": result[0].description,
          "weight": result[0].weight,
          "height": result[0].height,
          "__v": result[0].__v});
      }
    }
    deliveries.forEach(element => {
      element.products=productsResult.filter(product =>product.weight>=req.body.weight)
    });
  return {
    totalResults: totalResults,
    deliveries
  }
}

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`
      }
    }
  }
}

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({_id: req.body.id});
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`
      }
    }
  }
  return delivery;
}

export default {
  find,
  create,
  findOne
}
