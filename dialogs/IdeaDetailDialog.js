import React, { useEffect, useState } from 'react';
import Image from 'next/image'
import { Rating } from '@material-ui/lab';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import { join, throttle, size, reduce, map, keys, values } from 'lodash';

import { ArrowForwardIos, Category, Star } from '@material-ui/icons';
import CommentsDialog from './CommentsDialog';
import { IconButton, CircularProgress } from '@material-ui/core';
import PickedUsersDialog from './PickedUsersDialog';
import { getIdeaComments } from '../firebase/ideas';
import { changeUserGrade, getUserById } from '../firebase/users';
import { User } from '../models/User';


const Item = ({leftText, rightText}) => (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', margin: '12px 0'}}>
        <span style={{width: 120, textAlign: 'right', color: '#878787'}}>{leftText}</span>
        <span style={{color: '#C4C4C4', margin: '0 8px'}}>|</span>
        <span style={{flex: 1, color: '#323030', whiteSpace: 'pre-line'}}>{rightText}</span>
    </div>
)

const IdeaDetailDialog = ({data, open, setOpen}) => {
    if(!data) return null;

    console.log(data);

    const { id, owner, nickName, subject, category, scampers, detail, rating, pickedUsers } = data;

    const [ showingCommentList, setShowingCommentList ] = useState(false);
    const [ openPickedUsers, setOpenPickedUsers ] = useState(false);
    const [ comments, setComments ] = useState([]);

    const [ userGrade, setUserGrade ] = useState();
    const [ ideaOwner, setIdeaOwner ] = useState({});

    const [ loading, setLoading ] = useState(false);

    const [ overallRating, setOverallRate ] = useState({})

    useEffect(() => {
        if(id){
            getIdeaComments(id).then(setComments);
            setUserGrade(owner.grade);
        }
    });

    useEffect(() => {
        if(owner.uid){
            loadIdeaOwner(owner.uid);
        }
    }, [owner]);

    useEffect(() => {
        const ratingSize = size(rating);
        if(ratingSize > 0){

            const overallRate = reduce(rating, (sum, rate) => {
                sum.avg = sum.avg + rate.avgRating;
                sum.creativity += rate.creativityRate;
                sum.practicality += rate.practicalityRate;
                sum.valuable += rate.valuableRate;

                return sum;
            }, {avg: 0, creativity: 0, practicality: 0, valuable: 0});


            return setOverallRate({
                avg: +(overallRate.avg/ratingSize).toFixed(1),
                creativity: +(overallRate.creativity/ratingSize).toFixed(1),
                practicality: +(overallRate.practicality/ratingSize).toFixed(1),
                valuable: +(overallRate.valuable/ratingSize).toFixed(1)
            })
        }

        return setOverallRate({avg: 0, creativity: 0, practicality: 0, valuable: 0});

    }, [rating]);

    const loadIdeaOwner = async (uid) => {
        const user = await getUserById(uid);
        setIdeaOwner(new User(user));
        setUserGrade(user.grade);
    }

    const changeGrade = async () => {
        setLoading(true);
        try{
            const nextGrade = userGrade===4?1:(userGrade+1);

            await changeUserGrade(owner.uid, nextGrade)
            setUserGrade(nextGrade);
        }catch(ex){
            console.log('changeGrade', ex);
        }
        setLoading(false);
    }

    const getUserGrade = (userGrade) => {
        switch(userGrade){
            case 1: return '??????';
            case 2: return '??????';
            case 3: return '???';
            case 4: return '??????';
        }
    }

    const solution = join(map(keys(detail.solution), (key, index) => `${key}: ${values(detail.solution)[index]}`), '\n');

    return (
        <>
        <Dialog maxWidth='lg' open={open} onClose={() => setOpen(false)} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">????????? ?????????</DialogTitle>
            <DialogContent>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <div style={{display: 'flex', flexDirection: 'column', flex: 1, marginRight: 20}}>
                        <div style={{display: 'flex', flexDirection: 'row', paddingBottom: 20}}>
                            <div style={{width: 68, height: 68}}>
                                <img src={ideaOwner.profileImageUrl || '/assets/icons/ic_profile.png'} width={68} height={68} alt=''/>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', marginLeft: 16}}>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <span style={{fontSize: 20, fontWeight: 'bold', marginRight: 8}}>{nickName}</span>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{ideaOwner.gender==='M' ? '???' : '???'}/ {ideaOwner.yearsOnJob}?????? / {ideaOwner.department}</span>
                                        <span style={{color: '#797979'}}>{ideaOwner.phoneNumber}</span>
                                    </div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
                                    {/* <div style={{display: 'flex', flexDirection: 'row', marginRight: 24}}>
                                        <span style={{color: '#797979', marginRight: 4}}>?????? ??????</span>
                                        <span>????????????</span>
                                    </div> */}
                                    <div style={{display: 'flex', flexDirection: 'row'}}>
                                        <span style={{color: '#797979', marginRight: 4}}>?????? ??????</span>
                                        <span>{ideaOwner.lastLoginTime}</span>
                                    </div>
                                </div>
    
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 16}}>
                                    <div style={{display: 'flex', flexDirection: 'row', marginRight: 16}}>
                                        <span style={{color: '#797979', marginRight: 4}}>?????? ??????</span>
                                        <span>{getUserGrade(userGrade)}</span>
                                    </div>
                                    <div
                                        style={{cursor: 'pointer', backgroundColor: '#1379FF', padding: 4, width: 80, textAlign: 'center'}}
                                        onClick={throttle(changeGrade, 3000, {trailing: false})}
                                    >
                                        {
                                            loading ?
                                            <CircularProgress size={12} style={{color:'#fff'}} />
                                            :
                                            <span style={{color: 'white'}}>{userGrade < 4 ? '?????? up' : '?????? down'}</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', flex: 1, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: '#BEBEBE', padding: '20px 0'}}>
                            <Item
                                leftText='????????????'
                                rightText={category}
                            />
                            <Item
                                leftText='???????????? ??????'
                                rightText='?????? ???????????? ??????'
                            />
                            <Item
                                leftText='?????????'
                                rightText={scampers}
                            />
                            <Divider />
                            <Item
                                leftText='??????'
                                rightText={subject}
                            />
                            <Divider />
                            <Item
                                leftText='????????? ??????'
                                rightText={detail.object}
                            />
                            <Item
                                leftText='????????? ??????'
                                rightText={detail.situation}
                            />
                            <Item
                                leftText='?????? ??????'
                                rightText={solution}
                            />
                            <Divider />
    
                        </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', backgroundColor: '#EEF6FF', width: 300, padding: 20}}>
                        <div style={{marginBottom: 48}}>
                            <span style={{display: 'flex', fontWeight: 'bold', fontSize: 15, alignItems: 'center'}}>???<Star style={{color: '#FFC700', marginLeft: 8}} /> {overallRating.avg}</span>
                            <Divider style={{margin: '8px 0'}}/>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <span>?????????</span>
                                    <Rating
                                        // disabled={true}
                                        readOnly={true}
                                        value={overallRating.practicality}
                                        style={{margin: '0 8px'}}
                                    />
                                    <span>{overallRating.practicality}</span>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                                    <span>?????????</span>
                                    <Rating
                                        // disabled={true}
                                        readOnly={true}
                                        value={overallRating.creativity}
                                        style={{margin: '0 8px'}}
                                    />
                                    <span>{overallRating.creativity}</span>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                                    <span>?????????</span>
                                    <Rating
                                        // disabled={true}
                                        readOnly={true}
                                        value={overallRating.valuable}
                                        style={{margin: '0 8px'}}
                                    />
                                    <span>{overallRating.valuable}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{marginBottom: 48}}>
                            <span style={{fontWeight: 'bold', fontSize: 15}}>????????? ?????????</span>
                            <Divider style={{margin: '8px 0'}}/>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                <span>{comments.length}???</span>
                                <IconButton onClick={() => setShowingCommentList(true)}>
                                    <ArrowForwardIos color='#686868' style={{fontSize:16}}/>
                                </IconButton>
                            </div>
                        </div>
    
                        <div>
                            <span style={{fontWeight: 'bold', fontSize: 15}}>PICK</span>
                            <Divider style={{margin: '8px 0'}}/>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                <span>{size(pickedUsers)}???</span>
                                <IconButton disabled={size(pickedUsers)===0} onClick={() => setOpenPickedUsers(true)}>
                                    <ArrowForwardIos color='#686868' style={{fontSize:16}}/>
                                </IconButton>
                            </div>
                        </div>
                    </div>
                </div>
                
            </DialogContent>
            <DialogActions>
                {/* <Button onClick={() => setOpen(false)} variant='outlined'>
                    ??????
                </Button> */}
                <Button onClick={() => setOpen(false)} variant='contained' color="primary">
                    ??????
                </Button>
            </DialogActions>
        </Dialog>
        {
            showingCommentList &&
            <CommentsDialog open={showingCommentList} setOpen={setShowingCommentList} comments={comments}/>
        }
        {
            openPickedUsers &&
            <PickedUsersDialog users={pickedUsers} open={openPickedUsers} setOpen={setOpenPickedUsers} />
        }
        </>
    )
}

export default IdeaDetailDialog;