const { prisma } = require("../utils/prisma");
const { createPaginator } = require("prisma-pagination");

const paginate = createPaginator();


const getVendors = async (query) => {
    try {
        let page = query.page || 1;
        let perPage = 8;
        let search = query.search || '';
        let filter = query.filter || ''; 

        let whereClause = {
            OR: [
                { vendor_id: { contains: search, mode: 'insensitive' } },
                { company_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ]
        };

        if (filter) {
            whereClause = {
                ...whereClause,
                AND: { status: filter }
            };
        }

        const vendors = await paginate(prisma.vendor, {
            where: whereClause,
            select: {
                id: true,
                vendor_id: true,
                requested_on: true,
                company_name: true,
                phone: true,
                email: true,
                address: true,
                status: true
            },
            orderBy: {
                id: 'desc'
            }
        }, 
        { page: page, perPage: perPage });

        return vendors;

    } catch (err) {
        console.error(err);
        throw ({status: 500, message: "Cannot get Vendors"});
    }
}



const getVendorDetail = async (id) => {
    try {
        const vendor = await prisma.vendor.findFirst({
            where: {
              vendor_id: id
            }
          });
        return vendor;
    } catch (err) {
        console.error(err);
        throw ({status: 500, message: "Cannot get Detail"});
    }
}


const updateVendorStatus = async (id, body) => {
    try {
        const vendor = await prisma.vendor.update({
            where: {
              id: id
            },
            data: {
                status: body.status
            }
          });
        
        await prisma.user.update({
            where: {
                id: vendor.user_id
            },
            data: {
                verified: body.status === 'Approved' ? true : false
            }
        });
        return vendor;

    } catch (err) {
        console.error(err);
        throw ({status: 500, message: "Cannot update Status"});
    }
}

const getMiniList = async (query) => {
    try {
        const vendors = await prisma.vendor.findMany({
            where: {
                status: "Approved",
                company_name: {contains: query.search, mode: 'insensitive'}
            },
            select: {
                id: true,
                vendor_id: true,
                company_name: true
            },
            orderBy: {
                company_name: 'asc'
            }
        });
        return vendors;
    } catch (err) {
        console.log(err);
        throw({status: 500, message: "Cannot get list"});
    }
}

const updateCreditLimit = async (body, id, user) => {
    try {
        const existingCreditLimit = await prisma.credit.findUnique({
            where: {
                contractor_id_vendor_id: {
                    contractor_id: id,
                    vendor_id: user.vendor.id
                }
            }
        });

        let creditLimit;
        if (existingCreditLimit) {
            creditLimit = await prisma.credit.update({
                where: {
                    id: existingCreditLimit.id
                },
                data: {
                    amount: parseFloat(existingCreditLimit.amount) + parseFloat(body.amount)
                }
            });
        } else {
            creditLimit = await prisma.credit.create({
                data: {
                    contractor: {
                        connect: { id: id }
                    },
                    vendor: {
                        connect: { id: user.vendor.id }
                    },
                    amount: body.amount
                }
            });
        }

        return creditLimit;
    } catch (err) {
        console.log(err);
        throw({status: 500, message: "Cannot update credit limit"});
    }
}

module.exports = {
    getVendors,
    getVendorDetail,
    updateVendorStatus,
    getMiniList,
    updateCreditLimit
}