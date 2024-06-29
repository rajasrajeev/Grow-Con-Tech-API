const { prisma } = require("../utils/prisma");
const { generatePasswordHash } = require('./user.service');
const { subDays, startOfDay, endOfDay } = require('date-fns');
const { createPaginator } = require("prisma-pagination");

const paginate = createPaginator();

const createEnquiry = async (user, body) => {
    try {
        const enquiry = await prisma.enquiry.create({
            data: {
                product: {
                    connect: { id: parseInt(body.product_id, 10) }
                },
                vendor: {
                    connect: { id: parseInt(body.vendor_id, 10) }
                },
                contractor: {
                    connect: { id: parseInt(user.contractor.id, 10) }
                },
                enquiry_id: "ENQ",
                quantity: body.quantity,
                negotiations: {
                    create: {
                        price_from_contractor: parseInt(body.price_from_contractor, 10),
                        status: 'REPLIED'
                    }
                }
            },
        });

        const enquiry_id = `ENQ${1000 + enquiry.id}`;

        const updatedEnquiry = await prisma.enquiry.update({
            where: { id: enquiry.id },
            data: { enquiry_id }
        });

        return updatedEnquiry;

    } catch (err) {
        console.error(err);
        throw ({ status: 500, message: "Something went wrong" })
    }
}

const getEnquiries = async (vendor_id, query) => {

    try {
        let page = query.page || 1;
        let perPage = 8;
        let search = query.search || '';
        let status = query.status || '';
        let contractor = query.contractor || '';

        let whereClause = {
            AND: [
                {
                    OR: [
                        { enquiry_id: { contains: search, mode: 'insensitive' } },
                        { product: { name: { contains: search, mode: 'insensitive' } } },
                        { contractor: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                },
                { vendor_id: vendor_id }
            ]
        };

        if (status) {
            whereClause.AND.push({ negotiations :{ status: status }});
        }
        if (contractor) {
            whereClause.AND.push({contractor: { name: contractor }});
        }
        const enquiry = await paginate(prisma.enquiry, {
            where: whereClause,
            include: {
                product: { select: { id: true, name: true } },
                vendor: { select: { id:true, company_name: true } },
                contractor: { select: { id: true, name: true } },
                negotiations: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                id: 'desc'
            },
        }, 
        { page: page, perPage: perPage });

        return enquiry;

    } catch (err) {
        console.error(err);
        throw ({status: 500, message: "Cannot get enquiries"});
    }
};

const updateNegotiation = async (id, body) => {
    try {
        return await prisma.negotiation.update({
            where: { id: id },
            data: {
                price_from_vendor: body.price_from_vendor
            }
        });

    } catch (err) {
        console.log(err);
        throw ({ status: 403, message: "Sorry, Something went wrong!!!" });
    }
}

const getContractors = async (user) => {
    try {
        const contractors = await prisma.enquiry.findMany({
            where: {
              vendor_id: user.vendor.id
            },
            select : {
                contractor: {
                    select : {
                        name: true
                    }
                }
            }
          });
        return contractors;
    } catch (err) {
        console.log(err);
        throw ({ status: 403, message: "Sorry, Something went wrong!!!" });
    }
}

module.exports = {
    createEnquiry,
    getEnquiries,
    updateNegotiation,
    getContractors
}